import { Resolvers } from "../../../types/resolvers";
import { EmailSignUpResponse, EmailSignUpInput } from "GraphType";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";
import { CountryInfoModel } from "../../../models/CountryInfo";
import { ApolloError } from "apollo-server";
import { AttributeType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { mongoose } from "@typegoose/typegoose";
import { StoreGroupModel } from "../../../models/StoreGroup";

const resolvers: Resolvers = {
    Mutation: {
        EmailSignUp: defaultResolver(
            async ({ args: { param } }): Promise<EmailSignUpResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const {
                        username,
                        email,
                        password,
                        phoneNumber,
                        timezone,
                        roles
                    } = param as EmailSignUpInput;

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

                    const cognito = new CognitoIdentityServiceProvider();
                    const tz = countryInfo.timezones.find(
                        tz => tz.name === timezone
                    );
                    const zoneinfo = {
                        name: countryInfo.countryName,
                        tz: tz?.name,
                        code: countryInfo.countryCode,
                        offset: tz?.offset,
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
                            Value: phoneNumber
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
                    roles.forEach((role): void => {
                        if (role === "BUYER") {
                            userAttributes.push({
                                Name: "custom:isBuyer",
                                Value: "1"
                            });
                        } else if (role === "SELLER") {
                            userAttributes.push({
                                Name: "custom:isSeller",
                                Value: "1"
                            });
                        }
                    });
                    if (roles.length === 0) {
                        throw new ApolloError(
                            "User.Roles값이 비어있습니다.",
                            "EMPTY_USER_ROLES"
                        );
                    }
                    const result = await cognito
                        .signUp({
                            ClientId: process.env.COGNITO_CLIENT_ID || "",
                            Username: email,
                            Password: password,
                            UserAttributes: userAttributes
                        })
                        .promise();
                    const group = StoreGroupModel.makeDefaultGroup(_id);
                    const user = new UserModel({
                        _id,
                        sub: result.UserSub,
                        zoneinfo,
                        loginInfos: [],
                        groupIds: [group._id]
                    });
                    // TODO: EmailSignUp 하는 동시에 "기본 그룹"을 생성한다.
                    await user.save({ session });
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
                                        result.CodeDeliveryDetails
                                            .AttributeName || null,
                                    DeliveryMedium:
                                        result.CodeDeliveryDetails
                                            .DeliveryMedium || null,
                                    Destination:
                                        result.CodeDeliveryDetails
                                            .Destination || null
                                }) ||
                                null,
                            UserConfirmed: result.UserConfirmed,
                            UserSub: result.UserSub
                        }
                    };
                } catch (error) {
                    await session.abortTransaction();
                    session.endSession();
                    return {
                        ok: false,
                        error: {
                            msg: error.message,
                            code: error.code || error.extensions.code
                        },
                        data: null
                    };
                }
            }
        )
    }
};
export default resolvers;
