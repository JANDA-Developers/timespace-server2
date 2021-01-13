"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetProductPriceFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Product_1 = require("../../../models/Product/Product");
exports.SetProductPriceFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { productId, input: { defaultPrice, segmentPrice } } = args;
        const product = await Product_1.ProductModel.findById(productId);
        if (!product) {
            throw new apollo_server_1.ApolloError("존재하지 않는 ProductId 입니다", values_1.ERROR_CODES.UNEXIST_PRODUCT);
        }
        if (!product.userId.equals(cognitoUser._id)) {
            throw new apollo_server_1.ApolloError("해당 Product에 접근 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_PRODUCT);
        }
        if (defaultPrice != null && defaultPrice >= 0) {
            product.defaultPrice = defaultPrice;
        }
        if (segmentPrice != null && segmentPrice >= 0) {
            product.segmentPrice = segmentPrice;
        }
        await product.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        SetProductPrice: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.SetProductPriceFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=SetProductPrice.resolvers.js.map