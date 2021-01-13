"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMyProfileForBuyerFunc = void 0;
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
exports.UpdateMyProfileForBuyerFunc = async ({ args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoBuyer } = req;
        const { sub } = cognitoBuyer;
        const { param: { name, phoneNumber, timezone } } = args;
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
        stack.push({ cognitoUser: cognitoBuyer });
        stack.push({ user });
        const cognito = new CognitoIdentityServiceProvider();
        const cognitoUpdateResult = await cognito
            .adminUpdateUserAttributes({
            UserAttributes: attributes,
            UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
            Username: cognitoBuyer["cognito:username"] || cognitoBuyer.sub
        })
            .promise();
        if (cognitoUpdateResult.$response.error) {
            throw cognitoUpdateResult.$response.error;
        }
        const refreshResult = await refreshToken_1.refreshToken(user.refreshToken, "BUYER");
        if (!refreshResult.ok || !refreshResult.data) {
            throw new apollo_server_1.ApolloError("Token Refresh 실패", values_1.ERROR_CODES.TOKEN_REFRESH_FAIL);
        }
        user.refreshToken = refreshResult.data.refreshToken;
        user.refreshTokenLastUpdate = new Date();
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            // Let's return Refreshed Token
            data: refreshResult.data.idToken
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        UpdateMyProfileForBuyer: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForBuyer(exports.UpdateMyProfileForBuyerFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=UpdateMyProfileForBuyer.resolvers.js.map