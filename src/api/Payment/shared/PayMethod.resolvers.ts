import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
    PayMethod: {
        __resolveType: value => {
            return value;
        }
    }
};
export default resolvers;
