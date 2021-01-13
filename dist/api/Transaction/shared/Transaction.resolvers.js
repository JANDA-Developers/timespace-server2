"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../../models/User");
const Store_1 = require("../../../models/Store/Store");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
const Item_1 = require("../../../models/Item/Item");
const resolvers = {
    Transaction: {
        seller: async (trx) => {
            // 정보유출 위험있음.
            // Null로 저리하거나 해야할듯함.
            return User_1.UserModel.findById(trx.sellerId);
        },
        store: async (trx) => {
            return Store_1.StoreModel.findById(trx.sellerId);
        },
        storeUser: async (trx) => {
            return StoreUser_1.StoreUserModel.findById(trx.sellerId);
        },
        item: async (trx) => {
            return Item_1.ItemModel.findById(trx.itemId);
        },
        amount: async (trx) => {
            return trx.amountInfo.origin;
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=Transaction.resolvers.js.map