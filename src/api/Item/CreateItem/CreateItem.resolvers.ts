import { Resolvers } from "../../../types/resolvers";
import {
    CreateItemMutationArgs,
    CreateItemResponse
} from "../../../types/graph";

const resolvers: Resolvers = {
    Mutation: {
        CreateItem: async (
            __,
            { param }: CreateItemMutationArgs
        ): Promise<CreateItemResponse> => {
            try {
                console.log(param);
                throw new Error("뀨");
                // const {} = param;
            } catch (error) {
                return {
                    ok: false,
                    error,
                    data: null
                };
            }
        }
    }
};
export default resolvers;
