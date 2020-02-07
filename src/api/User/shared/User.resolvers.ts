import { Resolvers } from "../../../types/resolvers";
import { UserModel } from "../../../models/User";
import { StoreModel } from "../../../models/Store";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    User: {
        _id: cognitoUser =>
            (cognitoUser && cognitoUser["custom:_id"]) || cognitoUser._id,
        tokenExpiry: user => user.exp,
        zoneinfo: user => JSON.parse(user.zoneinfo),
        stores: async (cognitoUser, filter) => {
            const dbUser = await UserModel.findById(
                cognitoUser["custom:_id"] || cognitoUser._id
            );
            if (!dbUser) {
                return [];
            }
            return await StoreModel.find({
                _id: {
                    $in: dbUser.stores.map(id => new ObjectId(id))
                }
            });
        }
    }
};
export default resolvers;
