"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Store_1 = require("../../../models/Store/Store");
const Item_1 = require("../../../models/Item/Item");
const itemFilter_1 = require("./itemFilter");
const mongodb_1 = require("mongodb");
const User_1 = require("../../../models/User");
const resolvers = {
    Query: {
        GetItems: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args, context: { req } }) => {
            try {
                const { cognitoUser } = req;
                const user = await User_1.UserModel.findUser(cognitoUser);
                const { param } = args;
                const storeIds = param.storeId
                    ? [new mongodb_1.ObjectId(param.storeId)]
                    : user.stores;
                const store = await Store_1.StoreModel.findById(storeIds[0]);
                if (!store) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 StoreId", values_1.ERROR_CODES.UNEXIST_STORE);
                }
                if (!store.userId.equals(cognitoUser._id)) {
                    throw new apollo_server_1.ApolloError("접근 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_STORE);
                }
                const sortQuery = param.sort;
                const query = itemFilter_1.makeFilterQuery(param.filter, store.periodOption.offset);
                const itemsPromise = () => {
                    const func = Item_1.ItemModel.find({
                        storeId: { $in: storeIds },
                        ...query,
                        expiresAt: { $exists: false }
                    });
                    return (sortInput) => {
                        return func.sort({
                            [sortInput.sortKey]: sortInput.sort
                        });
                    };
                };
                const itemsGetFunc = itemsPromise();
                const result = [];
                if (sortQuery && sortQuery.length !== 0) {
                    let r;
                    for (const s of sortQuery) {
                        r = itemsGetFunc(s);
                    }
                    result.push(...(await r.exec()));
                }
                else {
                    result.push(...(await itemsGetFunc({
                        sortKey: "dateTimeRange.from",
                        sort: -1
                    }).exec()));
                }
                // const items = await ItemModel.find({
                //     storeId: store._id,
                //     ...query,
                //     expiresAt: { $exists: false }
                // }).sort({ "dateTimeRange.from": -1 });
                return {
                    ok: true,
                    error: null,
                    data: result
                };
            }
            catch (error) {
                const result = await utils_1.errorReturn(error);
                return {
                    ...result,
                    data: []
                };
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetItems.resolvers.js.map