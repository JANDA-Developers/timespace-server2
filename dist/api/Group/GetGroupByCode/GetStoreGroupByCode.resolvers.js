"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const StoreGroup_1 = require("../../../models/StoreGroup");
const resolvers = {
    Query: {
        GetStoreGroupByCode: resolverFuncWrapper_1.defaultResolver(async ({ args: { param } }) => {
            try {
                const { groupCode } = param;
                const group = await StoreGroup_1.StoreGroupModel.findByCode(groupCode);
                return {
                    ok: true,
                    error: null,
                    data: group
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error);
            }
        })
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetStoreGroupByCode.resolvers.js.map