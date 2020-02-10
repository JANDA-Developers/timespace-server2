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
                async ({ args: { param } }): Promise<DeleteProductResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { productCode } = param as DeleteProductInput;
                        const product = await ProductModel.findByCode(
                            productCode
                        );
                        const productId = new ObjectId(product._id);
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
                            itm => !productId.equals(itm)
                        );

                        await ProductModel.deleteOne(
                            {
                                _id: productId
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
