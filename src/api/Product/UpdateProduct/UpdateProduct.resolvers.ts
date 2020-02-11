import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    UpdateProductResponse,
    UpdateProductInput
} from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product";
import { ERROR_CODES } from "../../../types/values";
import { ApolloError } from "apollo-server";

const resolvers: Resolvers = {
    Mutation: {
        UpdateProduct: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<UpdateProductResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const {
                            productCode,
                            updateProductParamInput
                        } = param as UpdateProductInput;
                        const { cognitoUser } = req;
                        const product = await ProductModel.findByCode(
                            productCode
                        );
                        if (!product.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "Product 접근 권한이 없습니다.",
                                ERROR_CODES.PRODUCT_ACCESS_DENY
                            );
                        }
                        for (const fieldName in updateProductParamInput) {
                            const element = updateProductParamInput[fieldName];
                            if (element !== null) {
                                product[fieldName] = element;
                            }
                        }
                        await product.save({
                            session
                        });
                        await session.commitTransaction();
                        session.endSession();
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
