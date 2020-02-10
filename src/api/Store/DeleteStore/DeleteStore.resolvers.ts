import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { DeleteStoreResponse, DeleteStoreInput } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";
import { ProductModel } from "../../../models/Product";
import { ONE_DAY } from "../../../utils/dateFuncs";
import { ApolloError } from "apollo-server";

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
                                "UNEXIST_STORE"
                            );
                        }
                        const expiresAt = new Date(
                            new Date().getTime() + 7 * ONE_DAY
                        );
                        await StoreModel.updateOne(
                            {
                                code: store.code
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
                                $push: {
                                    disabledStores: store._id
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
