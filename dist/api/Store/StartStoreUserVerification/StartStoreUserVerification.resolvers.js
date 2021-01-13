"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartStoreUserVerificationFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const storeUserFunc_1 = require("../../../models/StoreUser/storeUserFunc");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
exports.StartStoreUserVerificationFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: stDoc } = req;
        const storeUser = await StoreUser_1.StoreUserModel.findById(stDoc._id);
        if (!storeUser) {
            throw new Error("존재하지 않는 StoreUserId");
        }
        const { target } = args;
        const verificationCode = await storeUserFunc_1.startStoreUserVerification(storeUser, target, session);
        console.log({
            type: "전화번호 인증",
            code: verificationCode,
            user: storeUser._id
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
        StartStoreUserVerification: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.StartStoreUserVerificationFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=StartStoreUserVerification.resolvers.js.map