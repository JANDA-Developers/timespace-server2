"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Store_1 = require("../../../models/Store/Store");
const resolvers = {
    Query: {
        GetStoreById: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { storeId } = param;
                const store = await Store_1.StoreModel.findById(storeId);
                if (!store) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Store", values_1.ERROR_CODES.UNEXIST_STORE);
                }
                if (store.expiresAt) {
                    throw new apollo_server_1.ApolloError("삭제된 상점입니다.", values_1.ERROR_CODES.DELETED_STORE);
                }
                if (!store.userId.equals(cognitoUser._id)) {
                    throw new apollo_server_1.ApolloError("Store 접근권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_STORE);
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
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetStoreById.resolvers.js.map