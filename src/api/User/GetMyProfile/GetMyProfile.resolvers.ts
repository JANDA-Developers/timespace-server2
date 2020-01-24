import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
    Query: {
        GetMyProfile: async (): Promise<null> => {
            return null;
        }
    }
};

export default resolvers;
