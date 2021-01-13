"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMyProfileFunc = void 0;
/* eslint-disable @typescript-eslint/camelcase */
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
const CountryInfo_1 = require("../../../models/CountryInfo");
const CognitoIdentityServiceProvider = require("aws-sdk/clients/cognitoidentityserviceprovider");
const refreshToken_1 = require("../../../utils/refreshToken");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
exports.UpdateMyProfileFunc = async ({ args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { sub } = cognitoUser;
        const { param: { name, phoneNumber, roles, timezone } } = args;
        let user = await User_1.UserModel.findOne({ sub });
        if (!user) {
            user = new User_1.UserModel({
                sub
            });
        }
        const attributes = [];
        if (name) {
            user.name = name;
            attributes.push({
                Name: "name",
                Value: name
            });
        }
        if (timezone) {
            const zoneinfo = await CountryInfo_1.CountryInfoModel.getZoneinfo(timezone);
            user.zoneinfo = zoneinfo;
            attributes.push({
                Name: "zoneinfo",
                Value: JSON.stringify(zoneinfo)
            });
        }
        if (phoneNumber) {
            const phoneNum = `${user.zoneinfo.callingCode}${phoneNumber}`;
            user.phone_number = phoneNum;
            attributes.push({
                Name: "phone_number",
                Value: phoneNum
            }, {
                Name: "phone_number_verified",
                Value: "false"
            });
        }
        if (roles && roles.length !== 0) {
            user.roles = roles;
        }
        stack.push({ cognitoUser });
        stack.push({ user });
        // Cognito 업데이트
        await cognitoUserInfoUpdate(cognitoUser, attributes);
        // 업데이트된 Cognito Token을 가져온다
        const idToken = await refreshUserToken(user);
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            // Let's return Refreshed Token
            data: idToken
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const cognitoUserInfoUpdate = async (cognitoUser, attributes) => {
    const cognito = new CognitoIdentityServiceProvider();
    const cognitoUpdateResult = await cognito
        .adminUpdateUserAttributes({
        UserAttributes: attributes,
        UserPoolId: process.env.COGNITO_POOL_ID || "",
        Username: cognitoUser["cognito:username"] || cognitoUser.sub
    })
        .promise();
    if (cognitoUpdateResult.$response.error) {
        throw cognitoUpdateResult.$response.error;
    }
};
const refreshUserToken = async (user) => {
    const refreshResult = await refreshToken_1.refreshToken(user.refreshToken, "SELLER");
    if (!refreshResult.ok || !refreshResult.data) {
        throw new apollo_server_1.ApolloError("Token Refresh 실패", values_1.ERROR_CODES.TOKEN_REFRESH_FAIL);
    }
    user.refreshToken = refreshResult.data.refreshToken;
    user.refreshTokenLastUpdate = new Date();
    return refreshResult.data.idToken;
};
const resolvers = {
    Mutation: {
        UpdateMyProfile: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.UpdateMyProfileFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=UpdateMyProfile.resolvers.js.map