"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetItemByCodeFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Item_1 = require("../../../models/Item/Item");
exports.GetItemByCodeFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeGroup } = req;
        const { itemCode } = args;
        const item = await Item_1.ItemModel.findByCode(itemCode);
        const isSellersStore = storeGroup.list.find(storeId => storeId.equals(item.storeId));
        if (!isSellersStore) {
            return {
                ok: true,
                error: null,
                data: null
            };
        }
        return {
            ok: true,
            error: null,
            data: item
        };
    }
    catch (error) {
        return utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Query: {
        GetItemByCode: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.GetItemByCodeFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetItemByCode.resolvers.js.map