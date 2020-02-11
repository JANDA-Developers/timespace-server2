import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    DeleteProductResponse,
    DeleteProductInput
} from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product";
import { StoreModel } from "../../../models/Store";
import { ObjectId } from "mongodb";

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
                                "UNEXIST_PRODUCT"
                            );
                        }
                        if (!product.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "상품 삭제 권한이 없습니다.",
                                "UNAUTHORIZE_USER"
                            );
                        }
                        const store = await StoreModel.findById(
                            product.storeId
                        );
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                "UNEXIST_STORE"
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
