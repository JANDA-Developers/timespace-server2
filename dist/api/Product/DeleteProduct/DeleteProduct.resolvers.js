"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Product_1 = require("../../../models/Product/Product");
const Store_1 = require("../../../models/Store/Store");
const mongodb_1 = require("mongodb");
const values_1 = require("../../../types/values");
const resolvers = {
    Mutation: {
        DeleteProduct: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { productId } = param;
                const pid = new mongodb_1.ObjectId(productId);
                const product = await Product_1.ProductModel.findById(pid);
                const { cognitoUser } = req;
                if (!product) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 ProductId", values_1.ERROR_CODES.UNEXIST_PRODUCT);
                }
                if (!product.userId.equals(cognitoUser._id)) {
                    throw new apollo_server_1.ApolloError("상품 접근 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_STORE);
                }
                const store = await Store_1.StoreModel.findById(product.storeId);
                if (!store) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Store", values_1.ERROR_CODES.UNEXIST_STORE);
                }
                store.products = store.products.filter(itm => !pid.equals(itm));
                await Product_1.ProductModel.updateOne({
                    _id: pid
                }, {
                    $set: {
                        isDeleted: true
                    }
                }, { session });
                await store.save({ session });
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null,
                    data: product
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=DeleteProduct.resolvers.js.map