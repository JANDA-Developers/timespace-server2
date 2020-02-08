import { Resolvers } from "../../../types/resolvers";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { CreateStoreInput, CreateStoreResponse } from "../../../types/graph";
import { errorReturn } from "../../../utils/utils";
import { mongoose } from "@typegoose/typegoose";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    Mutation: {
        CreateStore: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<CreateStoreResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const {
                            name,
                            type,
                            description
                        } = param as CreateStoreInput;
                        const _id = new ObjectId();
                        const store = new StoreModel({
                            _id,
                            user: new ObjectId(cognitoUser._id),
                            name,
                            type,
                            description
                        });
                        await store.save({ session });
                        await UserModel.findByIdAndUpdate(
                            cognitoUser._id,
                            {
                                $push: {
                                    stores: _id
                                }
                            },
                            {
                                session
                            }
                        );
                        stack.push(cognitoUser, store);

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
