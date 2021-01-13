"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Store_1 = require("../../../models/Store/Store");
const User_1 = require("../../../models/User");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const resolvers = {
    Query: {
        GetMyStores: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const user = await User_1.UserModel.findById(cognitoUser._id);
                if (!user) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 UserId", values_1.ERROR_CODES.UNEXIST_USER);
                }
                const stores = await Store_1.StoreModel.find({
                    _id: {
                        $in: user.stores
                    }
                });
                return {
                    ok: true,
                    error: null,
                    data: stores.filter(store => !store.expiresAt)
                };
            }
            catch (error) {
                return {
                    ...(await utils_1.errorReturn(error, session)),
                    data: []
                };
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetMyStores.resolvers.js.map