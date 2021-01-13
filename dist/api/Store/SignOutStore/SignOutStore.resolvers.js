"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignOutStoreFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
exports.SignOutStoreFunc = async ({ parent, info, args, context: { req } }, stack) => {
    try {
        const { storeGroup } = req;
        const storeGroupCode = storeGroup.code;
        if (req.session.storeGroupUsers) {
            req.session.storeGroupUsers[storeGroupCode] = undefined;
        }
        console.time("signOutStore_1");
        req.session.save(err => {
            if (err) {
                throw new err();
            }
        });
        console.timeEnd("signOutStore_1");
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Mutation: {
        SignOutStore: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.SignOutStoreFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=SignOutStore.resolvers.js.map