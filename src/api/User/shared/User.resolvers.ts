import { Resolvers } from "../../../types/resolvers";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    User: {
        _id: async cognitoUser => {
            const user = await UserModel.findOne({
                sub: cognitoUser.sub
            });
            return (user && user._id) || cognitoUser.sub;
        },
        tokenExpiry: user => user.exp,
        zoneinfo: user => JSON.parse(user.zoneinfo)
    }
};
export default resolvers;
