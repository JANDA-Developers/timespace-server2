import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { UpdateStoreResponse, UpdateStoreInput } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    Mutation: {
        UpdateStore: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<UpdateStoreResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const {
                            storeCode,
                            updateParam
                        } = param as UpdateStoreInput;
                        const store = await StoreModel.findByCode(storeCode);
                        if (!new ObjectId(cognitoUser._id).equals(store.user)) {
                            stack.push(cognitoUser, store);
                            throw new ApolloError(
                                "Store 사용 권한이 없습니다.",
                                "ACCESS_STORE_PERMISSION_DENY"
                            );
                        }
                        for (const field in updateParam) {
                            const value = updateParam[field];
                            store[field] = value;
                        }
                        await store.save({ session });
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
