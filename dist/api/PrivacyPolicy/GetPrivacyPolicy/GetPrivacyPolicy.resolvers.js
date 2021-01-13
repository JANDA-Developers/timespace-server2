"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPrivacyPolicyFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Store_1 = require("../../../models/Store/Store");
exports.GetPrivacyPolicyFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeCode } = args;
        const store = await Store_1.StoreModel.findByCode(storeCode);
        if (!store) {
            throw new Error("존재하지 않는 Store");
        }
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Query: {
        GetPrivacyPolicy: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.GetPrivacyPolicyFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetPrivacyPolicy.resolvers.js.map