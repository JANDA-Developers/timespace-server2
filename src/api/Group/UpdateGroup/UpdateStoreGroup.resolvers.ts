import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    UpdateStoreGroupResponse,
    UpdateStoreGroupInput
} from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";

const resolvers: Resolvers = {
    Mutation: {
        UpdateStoreGroup: defaultResolver(
            privateResolver(
                async (
                    { parent, info, args: { param }, context: { req } },
                    stack
                ): Promise<UpdateStoreGroupResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { ...p } = param as UpdateStoreGroupInput;
                        console.log({
                            cognitoUser,
                            p
                        });
                        await session.commitTransaction();
                        session.endSession();
                        throw new ApolloError(
                            "개발중",
                            ERROR_CODES.UNDERDEVELOPMENT
                        );
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};
export default resolvers;
