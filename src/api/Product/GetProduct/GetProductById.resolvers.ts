import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetProductByIdResponse, GetProductByIdInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product";
import { ERROR_CODES } from "../../../types/values";

const resolvers: Resolvers = {
    Query: {
        GetProductById: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<GetProductByIdResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { productId } = param as GetProductByIdInput;
                        const product = await ProductModel.findById(productId);
                        if (!product) {
                            throw new ApolloError(
                                "존재하지 않는 Product",
                                ERROR_CODES.UNEXIST_PRODUCT
                            );
                        }
                        if (!product.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "Product 접근권한이 없습니다. ",
                                ERROR_CODES.ACCESS_DENY_PRODUCT
                            );
                        }
                        return {
                            ok: true,
                            error: null,
                            data: product as any
                        };
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};
export default resolvers;
