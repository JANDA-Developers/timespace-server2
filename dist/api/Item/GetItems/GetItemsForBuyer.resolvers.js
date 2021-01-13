"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const itemFilter_1 = require("./itemFilter");
const Item_1 = require("../../../models/Item/Item");
const Buyer_1 = require("../../../models/Buyer");
const resolvers = {
    Query: {
        GetItemsForBuyer: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForBuyer(async ({ args, context: { req } }, stack) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoBuyer } = req;
                const { param } = args;
                const user = await Buyer_1.BuyerModel.findBySub(cognitoBuyer.sub);
                console.log(user);
                const query = itemFilter_1.makeFilterQuery(param.filter, user.zoneinfo.offset);
                const items = await Item_1.ItemModel.find({
                    buyerId: user._id,
                    expiresAt: {
                        $exists: false
                    },
                    ...query
                }).sort({ createdAt: -1 });
                return {
                    ok: true,
                    error: null,
                    data: items
                };
            }
            catch (error) {
                const reuslt = await utils_1.errorReturn(error, session);
                return {
                    ...reuslt,
                    data: []
                };
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetItemsForBuyer.resolvers.js.map