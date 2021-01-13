"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSignUpForBuyerFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const aws_sdk_1 = require("aws-sdk");
const CountryInfo_1 = require("../../../models/CountryInfo");
const mongodb_1 = require("mongodb");
const StoreGroup_1 = require("../../../models/StoreGroup");
const Buyer_1 = require("../../../models/Buyer");
exports.EmailSignUpForBuyerFunc = async ({ parent, info, args: { param }, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { username, email, password, phoneNumber, timezone } = param;
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        const countryInfo = await CountryInfo_1.CountryInfoModel.findOne({
            "timezones.name": timezone
        });
        if (!countryInfo) {
            throw new apollo_server_1.ApolloError("Timezone 설정이 잘못되었습니다.", "UNDEFINED_COUNTRYINFO", {
                timezone
            });
        }
        const tz = countryInfo.timezones.find(tz => tz.name === timezone);
        if (!tz) {
            throw new apollo_server_1.ApolloError(`Timezone is falcy value ${tz}`, "TIMEZONE_IS_FALCY");
        }
        const zoneinfo = {
            name: countryInfo.countryName,
            tz: tz.name,
            code: countryInfo.countryCode,
            offset: tz.offset,
            callingCode: countryInfo.callingCode
        };
        const _id = new mongodb_1.ObjectId();
        const userAttributes = [
            {
                Name: "name",
                Value: username
            },
            {
                Name: "email",
                Value: email
            },
            {
                Name: "phone_number",
                Value: `${zoneinfo.callingCode}${phoneNumber}`
            },
            {
                Name: "zoneinfo",
                // name, offset 으로 구성된 아이임 ㅎㅎ
                Value: JSON.stringify(zoneinfo)
            },
            {
                Name: "custom:_id",
                Value: _id.toHexString()
            }
        ];
        const result = await cognito
            .signUp({
            ClientId: process.env.COGNITO_CLIENT_ID_BUYER || "",
            Username: email,
            Password: password,
            UserAttributes: userAttributes
        })
            .promise();
        const group = StoreGroup_1.StoreGroupModel.makeDefaultGroup(_id);
        const buyer = new Buyer_1.BuyerModel({
            _id,
            sub: result.UserSub,
            zoneinfo,
            loginInfos: [],
            roles: ["BUYER"]
        });
        // TODO: EmailSignUp 하는 동시에 "기본 그룹"을 생성한다.
        await buyer.save({ session });
        await group.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: {
                CodeDeliveryDetails: (result.CodeDeliveryDetails && {
                    AttributeName: result.CodeDeliveryDetails.AttributeName || null,
                    DeliveryMedium: result.CodeDeliveryDetails.DeliveryMedium || null,
                    Destination: result.CodeDeliveryDetails.Destination || null
                }) ||
                    null,
                UserConfirmed: result.UserConfirmed,
                UserSub: result.UserSub
            }
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        EmailSignUpForBuyer: resolverFuncWrapper_1.defaultResolver(exports.EmailSignUpForBuyerFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=EmailSignUpForBuyer.resolvers.js.map