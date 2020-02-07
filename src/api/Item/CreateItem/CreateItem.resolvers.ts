import { Resolvers } from "../../../types/resolvers";
import {
    CreateItemMutationArgs,
    CreateItemResponse
} from "../../../types/graph";
import { ApolloError } from "apollo-server";

const resolvers: Resolvers = {
    Mutation: {
        CreateItem: async (
            __,
            { param }: CreateItemMutationArgs
        ): Promise<CreateItemResponse> => {
            try {
                console.log(param);
                throw new ApolloError("개발중", "UNDERDEVELOPMENT");
                // const {} = param;
            } catch (error) {
                return {
                    ok: false,
                    error: {
                        code: error.code || error.extensions.code,
                        msg: error.message
                    },
                    data: null
                };
            }
        }
    }
};
export default resolvers;
