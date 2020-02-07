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
                        console.log(store);

                        await StoreModel.deleteOne(
                            {
                                code: store.code
                            },
                            {
                                session
                            }
                        );
                        await UserModel.updateOne(
                            { _id: new ObjectId(cognitoUser._id) },
                            {
                                $pull: {
                                    stores: new ObjectId(store._id)
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
