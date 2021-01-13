"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../../models/User");
const Store_1 = require("../../../models/Store/Store");
const mongodb_1 = require("mongodb");
const StoreGroup_1 = require("../../../models/StoreGroup");
const resolvers = {
    User: {
        _id: cognitoUser => (cognitoUser && cognitoUser["custom:_id"]) || cognitoUser._id,
        tokenExpiry: user => user.exp,
        zoneinfo: user => typeof user.zoneinfo === "string"
            ? JSON.parse(user.zoneinfo)
            : user.zoneinfo,
        stores: async (cognitoUser, filter) => {
            const dbUser = await User_1.UserModel.findById(cognitoUser["custom:_id"] || cognitoUser._id);
            if (!dbUser) {
                return [];
            }
            return await Store_1.StoreModel.find({
                _id: {
                    $in: dbUser.stores.map(id => new mongodb_1.ObjectId(id))
                }
            });
        },
        // 더이상 cognito에서 가져오지 않음
        // roles: (user): UserRole[] => {
        //     const result: UserRole[] = [];
        //     if (parseInt(user["custom:isBuyer"]) === 1) {
        //         result.push("BUYER");
        //     }
        //     if (parseInt(user["custom:isSeller"]) === 1) {
        //         result.push("SELLER");
        //     }
        //     if (parseInt(user["custom:isAdmin"]) === 1) {
        //         result.push("ADMIN");
        //     }
        //     return result;
        // },
        groups: async (user) => {
            if (user.groupIds) {
                return await StoreGroup_1.StoreGroupModel.find({
                    _id: {
                        $in: user.groupIds
                    }
                });
            }
            else {
                const dbUser = await User_1.UserModel.findById(user["custom:_id"]);
                if (dbUser) {
                    return await StoreGroup_1.StoreGroupModel.find({
                        _id: {
                            $in: dbUser.groupIds
                        }
                    });
                }
                else {
                    return [];
                }
            }
        },
        groupCount: async (user) => {
            if (user.groupIds) {
                return user.groupIds.length;
            }
            else {
                const dbUser = await User_1.UserModel.findById(user["custom:_id"]);
                if (dbUser) {
                    return dbUser.groupIds.length;
                }
                else {
                    return 0;
                }
            }
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=User.resolvers.js.map