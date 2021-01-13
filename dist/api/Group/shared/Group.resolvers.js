"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../../models/User");
const Store_1 = require("../../../models/Store/Store");
const Product_1 = require("../../../models/Product/Product");
const resolvers = {
    BaseGroup: {
        __resolveType: (group) => {
            switch (group.type) {
                case "STORE_GROUP":
                    return "StoreGroup";
                case "PRODUCT_GROUP":
                default:
                    return "ProductGroup";
            }
        },
        user: async (group) => {
            const user = await User_1.UserModel.findById(group.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFromCognito();
            return user;
        }
    },
    StoreGroup: {
        user: async (group) => {
            const user = await User_1.UserModel.findById(group.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFromCognito();
            return user;
        },
        list: async (group) => {
            return await Store_1.StoreModel.find({
                _id: {
                    $in: group.list
                }
            });
        },
        config: async (group) => {
            if (group.config) {
                return group.config;
            }
            const config = {
                design: {
                    color: "#32297d",
                    logo: null
                }
            };
            group.config = config;
            await group.save();
            return config;
        }
    },
    ProductGroup: {
        user: async (group) => {
            const user = await User_1.UserModel.findById(group.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFromCognito();
            return user;
        },
        list: async (group) => {
            return await Product_1.ProductModel.find({
                _id: {
                    $in: group.list
                },
                isDeleted: {
                    $ne: true
                }
            });
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=Group.resolvers.js.map