"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartResetPasswordStoreUserFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const verificationFunc_1 = require("../../../models/Verification/verificationFunc");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
exports.StartResetPasswordStoreUserFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeGroup } = req;
        const { email, target, payload } = args;
        const storeUser = await StoreUser_1.StoreUserModel.findOne({
            email,
            phoneNumber: new RegExp(payload, "gi")
        });
        if (!storeUser) {
            throw new Error("가입된 ID가 존재하지 않습니다. 회원가입을 먼저 시도해 주세요.");
        }
        const verification = await verificationFunc_1.startVerification(target, payload, storeGroup.code, session);
        storeUser.passwordChangeVerificationId = verification._id;
        await storeUser.save({ session });
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
        StartResetPasswordStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.StartResetPasswordStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=StartResetPasswordStoreUser.resolvers.js.map