import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    EmailSignUpForBuyerResponse,
    EmailSignUpForBuyerInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { CountryInfoModel } from "../../../models/CountryInfo";
import { ObjectId } from "mongodb";
import { AttributeType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { StoreGroupModel } from "../../../models/StoreGroup";
import { UserModel } from "../../../models/User";

export const EmailSignUpForBuyerFunc = async (
    { parent, info, args: { param }, context: { req } },
    stack: any[]
): Promise<EmailSignUpForBuyerResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            username,
            email,
            password,
            phoneNumber,
            timezone
        } = param as EmailSignUpForBuyerInput;

        const cognito = new CognitoIdentityServiceProvider();
        const countryInfo = await CountryInfoModel.findOne({
            "timezones.name": timezone
        });

        if (!countryInfo) {
            throw new ApolloError(
                "Timezone 설정이 잘못되었습니다.",
                "UNDEFINED_COUNTRYINFO",
                {
                    timezone
                }
            );
        }

        const tz = countryInfo.timezones.find(tz => tz.name === timezone);
        if (!tz) {
            throw new ApolloError(
                `Timezone is falcy value ${tz}`,
                "TIMEZONE_IS_FALCY"
            );
        }
        const zoneinfo = {
            name: countryInfo.countryName,
            tz: tz.name,
            code: countryInfo.countryCode,
            offset: tz.offset,
            callingCode: countryInfo.callingCode
        };
        const _id = new ObjectId();

        const userAttributes: AttributeType[] = [
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
        const group = StoreGroupModel.makeDefaultGroup(_id);
        const buyer = new UserModel({
            _id,
            sub: result.UserSub,
            zoneinfo,
            loginInfos: [],
            groupIds: [group._id],
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
                CodeDeliveryDetails:
                    (result.CodeDeliveryDetails && {
                        AttributeName:
                            result.CodeDeliveryDetails.AttributeName || null,
                        DeliveryMedium:
                            result.CodeDeliveryDetails.DeliveryMedium || null,
                        Destination:
                            result.CodeDeliveryDetails.Destination || null
                    }) ||
                    null,
                UserConfirmed: result.UserConfirmed,
                UserSub: result.UserSub
            }
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        EmailSignUpForBuyer: defaultResolver(EmailSignUpForBuyerFunc)
    }
};
export default resolvers;
