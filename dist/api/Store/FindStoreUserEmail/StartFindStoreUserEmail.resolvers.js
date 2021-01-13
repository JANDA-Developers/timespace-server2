"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartFindStoreUserEmailFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const verificationFunc_1 = require("../../../models/Verification/verificationFunc");
exports.StartFindStoreUserEmailFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeGroup } = req;
        const { phoneNumber } = args;
        const verification = await verificationFunc_1.startVerification("PHONE", phoneNumber, storeGroup.code, session);
        console.log({
            verification
        });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        StartFindStoreUserEmail: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.StartFindStoreUserEmailFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=StartFindStoreUserEmail.resolvers.js.map