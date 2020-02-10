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
import { ItemModel } from "../../../models/Item";
import { ONE_DAY } from "../../../utils/dateFuncs";

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
                        const { storeCode } = param as DeleteStoreInput;
                        const store = await StoreModel.findByCode(storeCode);
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
                        await ItemModel.updateMany(
                            {
                                _id: {
                                    $in: store.items
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
                                    disabledStore: store._id
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
