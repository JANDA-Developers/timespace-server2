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
import { ERROR_CODES } from "../../../types/values";

const resolvers: Resolvers = {
    Mutation: {
        CreateProduct: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<CreateProductResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const {
                            description,
                            // images,
                            name,
                            storeId,
                            intro,
                            warning,
                            optionalParams
                        } = param as CreateProductInput;

                        const { cognitoUser } = req;

                        const productId = new ObjectId();
                        const store = await StoreModel.findById(storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }

                        // TODO: Image Upload to S3, after that, save result in product

                        const product = new ProductModel({
                            _id: productId,
                            name,
                            userId: cognitoUser._id,
                            storeId: store._id,
                            description,
                            intro: intro || undefined,
                            warning: warning || undefined
                        });
                        product.usingPeriodOption = store.usingPeriodOption;
                        product.usingCapacityOption = store.usingCapacityOption;

                        if (optionalParams) {
                            if (optionalParams.periodOption) {
                                product.periodOption =
                                    optionalParams.periodOption;
                            }
                            for (const fieldName in optionalParams) {
                                const param = optionalParams[fieldName];
                                if (param) {
                                    product[fieldName] = param;
                                }
                            }
                            if (!product.businessHours) {
                                product.businessHours = store.businessHours;
                            }
                            if (!product.periodOption) {
                                product.periodOption = store.periodOption;
                            }
                        }

                        // TODO: Compare BusinessHours between "Store" and "ProductInput"
                        await product.save({ session });

                        await StoreModel.updateOne(
                            {
                                _id: store._id
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
