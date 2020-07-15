import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    AddTransactionHistoryResponse,
    AddTransactionHistoryMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForInternalExec
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";

export const AddTransactionHistoryFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<AddTransactionHistoryResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // const { cognitoUser } = req;
        const {
            transactionId,
            input
        } = args as AddTransactionHistoryMutationArgs;
        console.log({
            transactionId,
            input
        });
        /**
         * ============================================================
         *
         * Your Code Here~!
         *
         * ============================================================
         */
        await session.commitTransaction();
        session.endSession();
        throw new ApolloError("개발중", ERROR_CODES.UNDERDEVELOPMENT);
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        AddTransactionHistory: defaultResolver(
            privateResolverForInternalExec(AddTransactionHistoryFunc)
        )
    }
};
export default resolvers;
