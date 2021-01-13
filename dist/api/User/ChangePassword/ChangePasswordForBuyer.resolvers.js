"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordForBuyerFunc = void 0;
const apollo_server_1 = require("apollo-server");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const aws_sdk_1 = require("aws-sdk");
const refreshToken_1 = require("../../../utils/refreshToken");
const User_1 = require("../../../models/User");
exports.ChangePasswordForBuyerFunc = async ({ parent, info, args, context: { req } }, stack) => {
    try {
        const { cognitoUser, accessToken } = req;
        const user = await User_1.UserModel.findBySub(cognitoUser.sub);
        const { param } = args;
        validateParam(param);
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        const changeResult = await cognito
            .changePassword({
            AccessToken: accessToken,
            PreviousPassword: param.oldPw,
            ProposedPassword: param.newPw
        })
            .promise();
        if (changeResult.$response.error) {
            throw changeResult.$response.error;
        }
        const { error, data } = await refreshToken_1.refreshToken(user.refreshToken, "BUYER");
        if (!data) {
            throw error;
        }
        return {
            ok: true,
            error: null,
            data: data.idToken
        };
        /**
         * ============================================================
         *
         * Your Code Here~!
         *
         * ============================================================
         */
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const validateParam = (param) => {
    const { newPw, newPwRe } = param;
    if (newPw !== newPwRe) {
        throw new apollo_server_1.ApolloError("새 패스워드가 서로 일치하지 않습니다.", values_1.ERROR_CODES.PASSWORD_COMPARE_ERROR);
    }
};
const resolvers = {
    Mutation: {
        ChangePasswordForBuyer: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.ChangePasswordForBuyerFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=ChangePasswordForBuyer.resolvers.js.map