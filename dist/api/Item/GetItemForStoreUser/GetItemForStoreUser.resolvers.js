"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetItemForStoreUserFunc = void 0;
const apollo_server_1 = require("apollo-server");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const StoreGroup_1 = require("../../../models/StoreGroup");
exports.GetItemForStoreUserFunc = async ({ args, context: { req } }) => {
    try {
        const { storeUser } = req;
        const { itemCode } = args;
        const item = await Item_1.ItemModel.findByCode(itemCode);
        const storeGroup = await StoreGroup_1.StoreGroupModel.findById(storeUser.storeGroupId);
        const isInStoreGroup = (storeGroup === null || storeGroup === void 0 ? void 0 : storeGroup.list.findIndex(id => id.equals(item.storeId))) !== -1;
        if (!isInStoreGroup) {
            throw new apollo_server_1.ApolloError("접근 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_ITEM);
        }
        return {
            ok: true,
            error: null,
            data: item
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Query: {
        GetItemForStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.GetItemForStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetItemForStoreUser.resolvers.js.map