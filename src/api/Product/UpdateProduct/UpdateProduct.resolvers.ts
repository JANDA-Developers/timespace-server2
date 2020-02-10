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
                        const product = await ProductModel.findByCode(
                            productCode
                        );
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
