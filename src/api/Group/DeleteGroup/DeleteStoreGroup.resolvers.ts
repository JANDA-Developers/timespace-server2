import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    DeleteStoreGroupResponse,
    DeleteStoreGroupInput
} from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreGroupModel } from "../../../models/StoreGroup";

const resolvers: Resolvers = {
    Mutation: {
        DeleteStoreGroup: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<DeleteStoreGroupResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { groupId } = param as DeleteStoreGroupInput;
                        const group = await StoreGroupModel.findById(groupId);
                        if (!group) {
                            throw new ApolloError(
                                "존재하지 않는 Group",
                                ERROR_CODES.UNEXIST_GROUP
                            );
                        }
                        if (!group.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "Group 접근 권한이 없습니다."
                            );
                        }
                        await StoreGroupModel.deleteOne(
                            {
                                _id: group._id
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
                            data: group as any
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
