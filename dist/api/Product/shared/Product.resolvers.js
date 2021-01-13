"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Store_1 = require("../../../models/Store/Store");
const User_1 = require("../../../models/User");
const Item_1 = require("../../../models/Item/Item");
const resolvers = {
    Product: {
        store: async (product) => {
            return await Store_1.StoreModel.findById(product.storeId);
        },
        user: async (product) => {
            const user = await User_1.UserModel.findById(product.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFromCognito();
            return user;
        },
        items: async (product, { date, status }) => {
            try {
                const result = await product.getItems(date, status);
                return result;
            }
            catch (_a) {
                return [];
            }
        },
        totalItemCount: async (product) => {
            const itemCount = await Item_1.ItemModel.find({
                productId: product._id,
                expiresAt: {
                    $exists: false
                }
            }).countDocuments();
            return itemCount || 0;
        },
        schedules: async (product, { date, soldOut }) => {
            const result = await product.getSchedulesByDate(date, soldOut === null ? undefined : soldOut);
            return result;
        },
        intro: product => {
            if (!product.intro) {
                return "";
            }
            else {
                return product.intro;
            }
        },
        warning: product => {
            if (!product.warning) {
                return "";
            }
            else {
                return product.warning;
            }
        },
        bookingPolicy: (store) => {
            return (store.bookingPolicy || {
                limitFirstBooking: 0,
                limitLastBooking: 60
            });
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=Product.resolvers.js.map