"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetStoreForPublicFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
exports.GetStoreForPublicFunc = async ({ parent, info, args, context: { req } }, stack) => {
    try {
        const { store } = req;
        return {
            ok: true,
            error: null,
            data: store
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Query: {
        GetStoreForPublic: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.GetStoreForPublicFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetStoreForPublic.resolvers.js.map