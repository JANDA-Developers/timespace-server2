"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const User_1 = require("../../../models/User");
const resolvers = {
    Query: {
        GetItemById: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ parent, info, args, context: { req } }, stack) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { param } = args;
                const item = await Item_1.ItemModel.findById(param.itemId);
                if (!item) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 ItemId", values_1.ERROR_CODES.UNEXIST_ITEM);
                }
                if (item.buyerId.equals(cognitoUser._id)) {
                    return {
                        ok: true,
                        error: null,
                        data: item
                    };
                }
                const user = await User_1.UserModel.findById(cognitoUser._id);
                if (!user) {
                    throw new apollo_server_1.ApolloError("조회 권한이 없습니다", values_1.ERROR_CODES.ACCESS_DENY_ITEM);
                }
                if (!user.stores.find(storeId => storeId.equals(item.storeId))) {
                    throw new apollo_server_1.ApolloError("조회 권한이 없습니다", values_1.ERROR_CODES.ACCESS_DENY_ITEM);
                }
                return {
                    ok: true,
                    error: null,
                    data: item
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetItemById.resolvers.js.map