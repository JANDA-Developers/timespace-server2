"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const resolvers = {
    Query: {
        GetItemForBuyer: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForBuyer(async ({ args, context: { req } }, stack) => {
            try {
                const { cognitoBuyer } = req;
                const { param } = args;
                const item = await Item_1.ItemModel.findByCode(param.itemCode);
                if (!item.buyerId.equals(cognitoBuyer._id)) {
                    stack.push({ item });
                    stack.push({ cognitoUser: cognitoBuyer });
                    throw new apollo_server_1.ApolloError("접근 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_ITEM, {
                        cognitoUser: cognitoBuyer
                    });
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
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetItemForBuyer.resolvers.js.map