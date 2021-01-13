"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmCustomVerificationCodeFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const aws_sdk_1 = require("aws-sdk");
const User_1 = require("../../../models/User");
const Buyer_1 = require("../../../models/Buyer");
exports.ConfirmCustomVerificationCodeFunc = async ({ args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { code, email, role } = args;
        const { UserPoolId, Username } = await getUserInfo(email, code, role);
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        const result = await cognito
            .adminConfirmSignUp({
            UserPoolId,
            Username
        })
            .promise();
        console.log({ confirmResult: result });
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
const getUserInfo = async (email, code, role) => {
    if (role === "SELLER") {
        const seller = await User_1.UserModel.findOne({
            email
        }).exec();
        if (!seller) {
            throw new Error("가입된 ID가 없습니다.");
        }
        if (seller.confirmationCode !== code) {
            console.log(seller.confirmationCode);
            throw new Error("일치하지 않는 코드입니다.");
        }
        const UserPoolId = process.env.COGNITO_POOL_ID || "";
        return {
            UserPoolId,
            Username: seller.sub
        };
    }
    else {
        const buyer = await Buyer_1.BuyerModel.findOne({
            email
        }).exec();
        if (!buyer) {
            throw new Error("가입된 ID가 없습니다.");
        }
        if (buyer.confirmationCode !== code) {
            console.log(buyer.confirmationCode);
            throw new Error("일치하지 않는 코드입니다.");
        }
        const UserPoolId = process.env.COGNITO_POOL_ID_BUYER || "";
        return {
            UserPoolId,
            Username: buyer.sub
        };
    }
};
const resolvers = {
    Mutation: {
        ConfirmCustomVerificationCode: resolverFuncWrapper_1.defaultResolver(exports.ConfirmCustomVerificationCodeFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=ConfirmCustomVerificationCode.resolvers.js.map