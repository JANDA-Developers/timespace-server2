"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Item_1 = require("../../../models/Item/Item");
const resolvers = {
    Buyer: {
        _id: cognitoBuyer => (cognitoBuyer && cognitoBuyer["custom:_id"]) || cognitoBuyer._id,
        tokenExpiry: buyer => buyer.exp,
        zoneinfo: buyer => typeof buyer.zoneinfo === "string"
            ? JSON.parse(buyer.zoneinfo)
            : buyer.zoneinfo,
        items: async (buyer) => await Item_1.ItemModel.find({
            _id: { $in: buyer.items },
            expiresAt: { $exists: false }
        })
    }
};
exports.default = resolvers;
//# sourceMappingURL=Buyer.resolvers.js.map