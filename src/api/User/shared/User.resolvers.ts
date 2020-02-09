import { Resolvers } from "../../../types/resolvers";
import { UserModel } from "../../../models/User";
import { StoreModel } from "../../../models/Store";
import { ObjectId } from "mongodb";
import { UserRole } from "../../../types/graph";

const resolvers: Resolvers = {
    User: {
        _id: cognitoUser =>
            (cognitoUser && cognitoUser["custom:_id"]) || cognitoUser._id,
        tokenExpiry: user => user.exp,
        zoneinfo: user =>
            typeof user.zoneinfo === "string"
                ? JSON.parse(user.zoneinfo)
                : user.zoneinfo,
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
        },
        roles: (user): UserRole[] => {
            const result: UserRole[] = [];
            if (parseInt(user["custom:isBuyer"]) === 1) {
                result.push("BUYER");
            }
            if (parseInt(user["custom:isSeller"]) === 1) {
                result.push("SELLER");
            }
            if (parseInt(user["custom:isAdmin"]) === 1) {
                result.push("ADMIN");
            }
            return result;
        }
    }
};
export default resolvers;
