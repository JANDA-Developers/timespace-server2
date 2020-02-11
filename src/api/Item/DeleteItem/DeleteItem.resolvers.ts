import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { DeleteItemResponse, DeleteItemInput } from "../../../types/graph";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";

const resolvers: Resolvers = {
    Mutation: {
        DeleteItem: defaultResolver(
            async (
                { parent, info, args: { param }, context: { req } },
                stack
            ): Promise<DeleteItemResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const { ...args } = param as DeleteItemInput;
                    console.log(args);
                    throw new ApolloError("개발중", "UNDERDEVELOPMENT");
                } catch (error) {
                    return await errorReturn(error, session);
                }
            }
        )
    }
};
export default resolvers;
