import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
    User: {
        _id: cognitoUser => cognitoUser && cognitoUser["custom:_id"],
        tokenExpiry: user => user.exp,
        zoneinfo: user => JSON.parse(user.zoneinfo)
    }
};
export default resolvers;
