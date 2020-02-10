import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CreateProductResponse,
    CreateProductInput
} from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product";
import { ObjectId } from "mongodb";
import { StoreModel } from "../../../models/Store";
import { ApolloError } from "apollo-server";

const resolvers: Resolvers = {
    Mutation: {
        CreateProduct: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<CreateProductResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const {
                            description,
                            images,
                            name,
                            storeId,
                            optionalParams
                        } = param as CreateProductInput;

                        const productId = new ObjectId();
                        const store = await StoreModel.findById(storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                "UNEXIST_STORE"
                            );
                        }

                        const stid = new ObjectId(storeId);

                        const product = new ProductModel({
                            _id: productId,
                            name,
                            images,
                            storeId: stid,
                            description,
                            usingPeriodOption: store.usingPeriodOption || false,
                            usingCapacityOption:
                                store.usingCapacityOption || false
                        });
                        if (optionalParams) {
                            for (const fieldName in optionalParams) {
                                const param = optionalParams[fieldName];
                                if (param) {
                                    product[fieldName] = param;
                                }
                            }
                        }
                        await product.save({ session });

                        await StoreModel.updateOne(
                            {
                                _id: stid
                            },
                            {
                                $push: {
                                    products: productId
                                }
                            },
                            {
                                session
                            }
                        );
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
