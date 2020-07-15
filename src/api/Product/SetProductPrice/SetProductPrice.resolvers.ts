import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    SetProductPriceResponse,
    SetProductPriceMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";

export const SetProductPriceFunc = async ({
    args,
    context: { req }
}): Promise<SetProductPriceResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const {
            productId,
            input: { defaultPrice, segmentPrice }
        } = args as SetProductPriceMutationArgs;
        const product = await ProductModel.findById(productId);
        if (!product) {
            throw new ApolloError(
                "존재하지 않는 ProductId 입니다",
                ERROR_CODES.UNEXIST_PRODUCT
            );
        }
        if (!product.userId.equals(cognitoUser._id)) {
            throw new ApolloError(
                "해당 Product에 접근 권한이 없습니다.",
                ERROR_CODES.ACCESS_DENY_PRODUCT
            );
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
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        SetProductPrice: defaultResolver(privateResolver(SetProductPriceFunc))
    }
};
export default resolvers;
