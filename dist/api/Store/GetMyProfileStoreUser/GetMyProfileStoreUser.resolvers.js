"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMyProfileStoreUserFunc = void 0;
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
exports.GetMyProfileStoreUserFunc = async ({ context: { req } }, stack) => ({
    ok: true,
    error: null,
    data: req.storeUser
});
const resolvers = {
    Query: {
        GetMyProfileStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.GetMyProfileStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetMyProfileStoreUser.resolvers.js.map