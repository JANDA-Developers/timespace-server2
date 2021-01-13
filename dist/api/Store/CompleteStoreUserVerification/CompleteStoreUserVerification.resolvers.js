"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteStoreUserVerificationFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
exports.CompleteStoreUserVerificationFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: storeUserDoc } = req;
        const storeUser = await StoreUser_1.StoreUserModel.findById(storeUserDoc._id);
        if (!storeUser) {
            throw new Error("존재하지 않는 StoreUserId");
        }
        const { code, target } = args;
        if (target === "PHONE" && storeUser.phoneVerificationCode !== code) {
            throw new apollo_server_1.ApolloError("인증코드가 일치하지 않습니다.", values_1.ERROR_CODES.AUTHORIZATION_FAIL);
        }
        else {
            storeUser.verifiedPhoneNumber = true;
        }
        if (target === "EMAIL" && storeUser.emailVerificationCode !== code) {
            throw new apollo_server_1.ApolloError("인증코드가 일치하지 않습니다.", values_1.ERROR_CODES.AUTHORIZATION_FAIL);
        }
        else {
            storeUser.verifiedEmail = true;
        }
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
        CompleteStoreUserVerification: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.CompleteStoreUserVerificationFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CompleteStoreUserVerification.resolvers.js.map