"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpdateUserFunc = void 0;
/* eslint-disable @typescript-eslint/camelcase */
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
const cognitoidentityserviceprovider_1 = __importDefault(require("aws-sdk/clients/cognitoidentityserviceprovider"));
const CountryInfo_1 = require("../../../models/CountryInfo");
const Buyer_1 = require("../../../models/Buyer");
exports.AdminUpdateUserFunc = async ({ args }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        // TODO: 참고...
        // https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminUpdateUserAttributes.html
        const { param } = args;
        const { role, updateParam: { smsKey, phoneNumber, timezone, name } } = param;
        const user = role === "SELLER"
            ? await User_1.UserModel.findBySub(param.userSub)
            : await Buyer_1.BuyerModel.findBySub(param.userSub);
        const attributes = [];
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
        if (timezone) {
            const zoneinfo = await CountryInfo_1.CountryInfoModel.getZoneinfo(timezone);
            user.zoneinfo = zoneinfo;
            attributes.push({
                Name: "zoneinfo",
                Value: JSON.stringify(zoneinfo)
            });
        }
        if (name) {
            user.name = name;
            attributes.push({
                Name: "name",
                Value: name
            });
        }
        if (smsKey && role === "SELLER") {
            user.smsKey = smsKey;
            attributes.push({
                Name: "custom:smsKey",
                Value: smsKey
            });
        }
        // Cognito 업데이트
        await cognitoUserInfoUpdate(user.sub, role, attributes);
        // 업데이트된 Cognito Token을 가져온다
        // const { idToken } = await refreshUserToken(user);
        await user.save({
            session
        });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: ""
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const cognitoUserInfoUpdate = async (sub, role, attributes) => {
    const cognito = new cognitoidentityserviceprovider_1.default();
    const cognitoUpdateResult = await cognito
        .adminUpdateUserAttributes({
        UserAttributes: attributes,
        UserPoolId: (role === "SELLER"
            ? process.env.COGNITO_POOL_ID
            : process.env.COGNITO_POOL_ID_BUYER) || "",
        Username: sub
    })
        .promise();
    if (cognitoUpdateResult.$response.error) {
        throw cognitoUpdateResult.$response.error;
    }
};
// const refreshUserToken = async (user: DocumentType<UserCls>) => {
//     const refreshResult = await refreshToken(user.refreshToken, "SELLER");
//     if (!refreshResult.ok || !refreshResult.data) {
//         throw new ApolloError(
//             "Token Refresh 실패",
//             ERROR_CODES.TOKEN_REFRESH_FAIL
//         );
//     }
//     user.refreshToken = refreshResult.data.refreshToken;
//     user.refreshTokenLastUpdate = new Date();
//     return refreshResult.data;
// };
const resolvers = {
    Mutation: {
        AdminUpdateUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.AdminUpdateUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=AdminUpdateUser.resolvers.js.map