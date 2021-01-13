"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Product_1 = require("../../../models/Product/Product");
const values_1 = require("../../../types/values");
const resolvers = {
    Query: {
        GetProductById: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { productId } = param;
                const product = await Product_1.ProductModel.findById(productId);
                if (!product) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Product", values_1.ERROR_CODES.UNEXIST_PRODUCT);
                }
                if (!product.userId.equals(cognitoUser._id)) {
                    throw new apollo_server_1.ApolloError("Product 접근권한이 없습니다. ", values_1.ERROR_CODES.ACCESS_DENY_PRODUCT);
                }
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
//# sourceMappingURL=GetProductById.resolvers.js.map