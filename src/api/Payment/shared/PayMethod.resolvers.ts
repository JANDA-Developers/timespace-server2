import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
    PayMethodInfo: {
        __resolveType: value => {
            return value;
        }
    }
};
export default resolvers;
