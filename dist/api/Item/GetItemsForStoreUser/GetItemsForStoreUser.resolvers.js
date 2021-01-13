"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetItemsForStoreUserFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const itemFilter_1 = require("../GetItems/itemFilter");
const Item_1 = require("../../../models/Item/Item");
const mongodb_1 = require("mongodb");
exports.GetItemsForStoreUserFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser } = req;
        const { filter } = args;
        const query = itemFilter_1.makeFilterQuery(filter, storeUser.zoneinfo.offset);
        const items = await Item_1.ItemModel.find({
            storeUserId: new mongodb_1.ObjectId(storeUser._id),
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
        const result = await utils_1.errorReturn(error, session);
        return {
            ...result,
            data: []
        };
    }
};
const resolvers = {
    Query: {
        GetItemsForStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.GetItemsForStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetItemsForStoreUser.resolvers.js.map