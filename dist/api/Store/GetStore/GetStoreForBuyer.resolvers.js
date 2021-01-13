"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Store_1 = require("../../../models/Store/Store");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const resolvers = {
    Query: {
        GetStoreForBuyer: resolverFuncWrapper_1.defaultResolver(async ({ args: { param } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { storeCode } = param;
                const store = await Store_1.StoreModel.findByCode(storeCode);
                if (store.expiresAt) {
                    throw new apollo_server_1.ApolloError("삭제된 상점입니다.", values_1.ERROR_CODES.DELETED_STORE);
                }
                return {
                    ok: true,
                    error: null,
                    data: store
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        })
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetStoreForBuyer.resolvers.js.map