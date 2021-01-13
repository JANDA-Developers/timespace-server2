"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Item_1 = require("../../../models/Item/Item");
const Store_1 = require("../../../models/Store/Store");
const Product_1 = require("../../../models/Product/Product");
const User_1 = require("../../../models/User");
const ItemStatusChanged_1 = require("../../../models/ItemStatusChangedHistory/ItemStatusChanged");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const Buyer_1 = require("../../../models/Buyer");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
const Transaction_1 = require("../../../models/Transaction/Transaction");
const resolvers = {
    Item: {
        store: async (item) => {
            return Store_1.StoreModel.findById(item.storeId);
        },
        product: async (item) => {
            return Product_1.ProductModel.findById(item.productId);
        },
        user: async (item, args, { req }) => {
            const user = await User_1.UserModel.findById(item.userId);
            if (user) {
                await user.setAttributesFromCognito();
            }
            return user;
        },
        buyer: async (item, args, { req }) => {
            const buyer = await Buyer_1.BuyerModel.findById(item.buyerId);
            if (buyer) {
                await buyer.setAttributesFromCognito();
            }
            return buyer;
        },
        dateTimeRange: async (item) => {
            return item.dateTimeRange;
        },
        statusChangedHistory: async (item) => {
            const history = await ItemStatusChanged_1.ItemStatusChangedHistoryModel.find({
                _id: { $in: item.statusChangedHistory }
            }).sort({ createdAt: -1 });
            return history;
        },
        customFieldValues: async (item) => {
            return item.customFieldValues.map(f => {
                return {
                    ...f,
                    value: f.value || ""
                };
            });
        },
        storeUser: async (item) => {
            return StoreUser_1.StoreUserModel.findById(item.storeUserId).exec();
        },
        transaction: async (item) => {
            return Transaction_1.TransactionModel.findById(item.transactionId).exec();
        }
    },
    ItemStatusChanged: {
        worker: async (obj) => {
            const user = await User_1.UserModel.findById(obj.workerId);
            if (!user) {
                throw new apollo_server_1.ApolloError("존재하지 않는 User", values_1.ERROR_CODES.UNEXIST_USER, {
                    loc: "ItemStatusChanged.worker",
                    data: obj
                });
            }
            await user.setAttributesFromCognito();
            return user;
        },
        date: async (obj) => {
            return obj.createdAt;
        },
        item: async (obj) => {
            const item = await Item_1.ItemModel.findById(obj.itemId);
            if (!item) {
                throw new apollo_server_1.ApolloError("존재하지 않는 ItemId", values_1.ERROR_CODES.UNEXIST_ITEM, {
                    loc: "ItemStatusChanged.item",
                    data: obj
                });
            }
            return item;
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=item.resolvers.js.map