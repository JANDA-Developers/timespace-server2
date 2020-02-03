import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
    User: {
        _id: user => user.sub,
        tokenExpiry: user => user.exp,
        zoneinfo: user => JSON.parse(user.zoneinfo)
    }
};
export default resolvers;
