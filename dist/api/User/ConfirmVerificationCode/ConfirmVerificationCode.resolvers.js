"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmVerificationCodeFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const aws_sdk_1 = require("aws-sdk");
const User_1 = require("../../../models/User");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const Buyer_1 = require("../../../models/Buyer");
exports.ConfirmVerificationCodeFunc = async ({ parent, info, args, context: { req } }, stack) => {
    try {
        const { param } = args;
        const { code, email, role } = param;
        let user;
        if (role === "SELLER") {
            user = await User_1.UserModel.findOne({
                email
            }, {
                sub: 1
            }).exec();
        }
        else {
            user = await Buyer_1.BuyerModel.findOne({
                email
            }, {
                sub: 1
            }).exec();
        }
        if (!user) {
            throw new apollo_server_1.ApolloError("해당 Email로 가입된 ID가 없습니다. 계정을 생성해주세요.", values_1.ERROR_CODES.UNEXIST_USER);
        }
        const userSub = user.sub;
        // 참고자료: https://m.blog.naver.com/oksk0302/220986019426
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        await cognito
            .confirmSignUp({
            ClientId: (role === "SELLER" && process.env.COGNITO_CLIENT_ID) ||
                process.env.COGNITO_CLIENT_ID_BUYER ||
                "",
            ConfirmationCode: code,
            Username: userSub
        })
            .promise();
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
        ConfirmVerificationCode: resolverFuncWrapper_1.defaultResolver(exports.ConfirmVerificationCodeFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=ConfirmVerificationCode.resolvers.js.map