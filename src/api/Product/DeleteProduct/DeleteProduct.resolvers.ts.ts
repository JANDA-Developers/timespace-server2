import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { DeleteProductResponse, DeleteProductInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product";
import { StoreModel } from "../../../models/Store";
import { ObjectId } from "mongodb";
import { ERROR_CODES } from "../../../types/values";

const resolvers: Resolvers = {
    Mutation: {
        DeleteProduct: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<DeleteProductResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { productId } = param as DeleteProductInput;
                        const pid = new ObjectId(productId);
                        const product = await ProductModel.findById(pid);
                        const { cognitoUser } = req;
                        if (!product) {
                            throw new ApolloError(
                                "존재하지 않는 ProductId",
                                ERROR_CODES.UNEXIST_PRODUCT
                            );
                        }
                        if (!product.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "상품 접근 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE
                            );
                        }
                        const store = await StoreModel.findById(
                            product.storeId
                        );
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }

                        store.products = store.products.filter(
                            itm => !pid.equals(itm)
                        );

                        await ProductModel.deleteOne(
                            {
                                _id: pid
                            },
                            {
                                session
                            }
                        );
                        await store.save({ session });

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
