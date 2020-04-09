import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { FindMyEmailResponse, FindMyEmailInput } from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";

export const FindMyEmailFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<FindMyEmailResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { param }: { param: FindMyEmailInput } = args;
        /**
         * ============================================================
         *
         * Your Code Here~!
         *
         * ============================================================
         */
        console.log({ param });
        await session.commitTransaction();
        session.endSession();
        throw new ApolloError("개발중", ERROR_CODES.UNDERDEVELOPMENT);
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Query: {
        FindMyEmail: defaultResolver(FindMyEmailFunc)
    }
};
export default resolvers;
