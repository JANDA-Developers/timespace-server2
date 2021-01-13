"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Store_1 = require("../../../models/Store/Store");
const Product_1 = require("../../../models/Product/Product");
const User_1 = require("../../../models/User");
const StoreGroup_1 = require("../../../models/StoreGroup");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
const resolvers = {
    Store: {
        user: async (store, args, { req }) => {
            const user = await User_1.UserModel.findById(store.userId);
            if (user) {
                await user.setAttributesFromCognito();
            }
            return user;
        },
        products: async (store) => {
            return await Product_1.ProductModel.find({
                _id: {
                    $in: store.products
                    // .map(productId => new ObjectId(productId))
                },
                isDeleted: {
                    $ne: true
                }
            });
        },
        productCount: (store) => {
            return (store.products && store.products.length) || 0;
        },
        groups: async (store) => {
            const groups = await StoreGroup_1.StoreGroupModel.find({
                _id: {
                    $in: store.groupIds
                }
            });
            return groups;
        },
        group: async (store) => {
            if (store.groupIds[0]) {
                store.groupId = store.groupIds[0];
                await store.save();
            }
            return StoreGroup_1.StoreGroupModel.findById(store.groupId);
        },
        bookingPolicy: (store) => {
            return (store.bookingPolicy || {
                limitFirstBooking: 0,
                limitLastBooking: 60
            });
        },
        customFields: async (store) => {
            return store.customFields.map(c => {
                return {
                    ...c,
                    isMandatory: c.isMandatory || false
                };
            });
        },
        storeUsers: async (store) => {
            return StoreUser_1.StoreUserModel.find({
                storeId: {
                    $in: store._id
                }
            });
        },
        signUpOption: async (store) => {
            if (!store.signUpOption) {
                await Store_1.StoreModel.updateOne({ _id: store._id }, {
                    $set: {
                        signUpOption: {
                            acceptAnonymousUser: false,
                            userAccessRange: "STORE_GROUP",
                            useSignUpAutoPermit: false,
                            useEmailVerification: false,
                            usePhoneVerification: true,
                            signUpPolicyContent: null
                        }
                    }
                });
                return {
                    acceptAnonymousUser: false,
                    userAccessRange: "STORE_GROUP",
                    useSignUpAutoPermit: false,
                    useEmailVerification: false,
                    usePhoneVerification: true
                };
            }
            return store.signUpOption;
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=Store.resolvers.js.map