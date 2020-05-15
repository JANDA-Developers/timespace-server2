import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { DeleteStoreResponse, DeleteStoreInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store/Store";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";
import { ProductModel } from "../../../models/Product/Product";
import { ONE_DAY } from "../../../utils/dateFuncs";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { StoreGroupModel } from "../../../models/StoreGroup";

const resolvers: Resolvers = {
    Mutation: {
        DeleteStore: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<DeleteStoreResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { storeId } = param as DeleteStoreInput;
                        const store = await StoreModel.findById(storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 StoreId",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }
                        const expiresAt = new Date(
                            new Date().getTime() + 7 * ONE_DAY
                        );
                        await StoreModel.updateOne(
                            {
                                _id: store._id
                            },
                            {
                                $set: {
                                    expiresAt
                                }
                            },
                            {
                                session
                            }
                        );
                        await ProductModel.updateMany(
                            {
                                _id: {
                                    $in: store.products
                                }
                            },
                            {
                                $set: {
                                    expiresAt
                                }
                            },
                            {
                                session
                            }
                        );
                        await UserModel.updateOne(
                            { _id: new ObjectId(cognitoUser._id) },
                            {
                                $pull: {
                                    stores: store._id
                                }
                            },
                            {
                                session
                            }
                        );
                        await UserModel.updateOne(
                            { _id: new ObjectId(cognitoUser._id) },
                            {
                                $addToSet: {
                                    disabledStores: store._id
                                }
                            },
                            {
                                session
                            }
                        );
                        await StoreGroupModel.updateMany(
                            {
                                list: {
                                    $in: store.groupIds
                                }
                            },
                            {
                                $pull: {
                                    list: store._id
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
                            data: store as any
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
