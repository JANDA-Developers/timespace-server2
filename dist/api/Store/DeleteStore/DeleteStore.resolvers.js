"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Store_1 = require("../../../models/Store/Store");
const User_1 = require("../../../models/User");
const mongodb_1 = require("mongodb");
const Product_1 = require("../../../models/Product/Product");
const dateFuncs_1 = require("../../../utils/dateFuncs");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const StoreGroup_1 = require("../../../models/StoreGroup");
const resolvers = {
    Mutation: {
        DeleteStore: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { storeId } = param;
                const store = await Store_1.StoreModel.findById(storeId);
                if (!store) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 StoreId", values_1.ERROR_CODES.UNEXIST_STORE);
                }
                const expiresAt = new Date(new Date().getTime() + 7 * dateFuncs_1.ONE_DAY);
                await Store_1.StoreModel.updateOne({
                    _id: store._id
                }, {
                    $set: {
                        expiresAt
                    }
                }, {
                    session
                });
                await Product_1.ProductModel.updateMany({
                    _id: {
                        $in: store.products
                    }
                }, {
                    $set: {
                        expiresAt
                    }
                }, {
                    session
                });
                await User_1.UserModel.updateOne({ _id: new mongodb_1.ObjectId(cognitoUser._id) }, {
                    $pull: {
                        stores: store._id
                    }
                }, {
                    session
                });
                await User_1.UserModel.updateOne({ _id: new mongodb_1.ObjectId(cognitoUser._id) }, {
                    $addToSet: {
                        disabledStores: store._id
                    }
                }, {
                    session
                });
                await StoreGroup_1.StoreGroupModel.updateMany({
                    list: store.groupId
                }, {
                    $pull: {
                        list: new mongodb_1.ObjectId(store._id)
                    }
                }, {
                    session
                });
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null,
                    data: store
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=DeleteStore.resolvers.js.map