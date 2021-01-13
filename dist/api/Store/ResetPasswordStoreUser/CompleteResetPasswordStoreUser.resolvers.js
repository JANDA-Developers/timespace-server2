"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteResetPasswordStoreUserFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const verificationFunc_1 = require("../../../models/Verification/verificationFunc");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
exports.CompleteResetPasswordStoreUserFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeGroup } = req;
        const { code, newPassword, payload, target } = args;
        const verification = await verificationFunc_1.completeVerification({
            target,
            payload,
            code,
            storeGroupCode: storeGroup.code
        });
        if (!verification) {
            throw new Error("인증 실패");
        }
        const storeUser = await StoreUser_1.StoreUserModel.findOne({
            passwordChangeVerificationId: verification === null || verification === void 0 ? void 0 : verification._id
        });
        if (!storeUser) {
            throw new Error("존재하지 않는 StoreUser");
        }
        storeUser.password = newPassword;
        await storeUser.hashPassword();
        await storeUser.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            storeUser: storeUser
        };
    }
    catch (error) {
        const temp = await utils_1.errorReturn(error, session);
        return {
            ...temp,
            storeUser: null
        };
    }
};
const resolvers = {
    Mutation: {
        CompleteResetPasswordStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.CompleteResetPasswordStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CompleteResetPasswordStoreUser.resolvers.js.map