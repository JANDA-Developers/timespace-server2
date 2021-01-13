"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteFindStoreUserEmailFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const verificationFunc_1 = require("../../../models/Verification/verificationFunc");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
exports.CompleteFindStoreUserEmailFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeGroup } = req;
        const { phoneNumber, code } = args;
        const verificationResult = await verificationFunc_1.completeVerification({
            payload: phoneNumber,
            target: "PHONE",
            storeGroupCode: storeGroup.code,
            code
        }, session);
        if (!verificationResult) {
            throw new Error("인증에 실패하였습니다. 인증번호를 확인해주세요");
        }
        const storeUser = await StoreUser_1.StoreUserModel.findOne({
            $and: [
                {
                    $or: [
                        {
                            phoneNumber
                        },
                        {
                            phoneNumber: "+82" + phoneNumber
                        },
                        {
                            phoneNumber: "+82" + phoneNumber.substr(1)
                        }
                    ]
                },
                {
                    storeGroupCode: storeGroup.code
                }
            ]
        });
        if (!storeUser) {
            throw new apollo_server_1.ApolloError("가입된 Email이 없습니다.", values_1.ERROR_CODES.UNEXIST_STORE_USER);
        }
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            email: storeUser.email
        };
    }
    catch (error) {
        const temp = await utils_1.errorReturn(error, session);
        return {
            ...temp,
            email: null
        };
    }
};
const resolvers = {
    Mutation: {
        CompleteFindStoreUserEmail: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.CompleteFindStoreUserEmailFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CompleteFindStoreUserEmail.resolvers.js.map