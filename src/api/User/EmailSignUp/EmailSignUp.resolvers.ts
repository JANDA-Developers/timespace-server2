import { Resolvers } from "../../../types/resolvers";
import { EmailSignUpResponse, EmailSignUpInput, UserRole } from "GraphType";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";
import { AttributeType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { mongoose } from "@typegoose/typegoose";
import { StoreGroupModel } from "../../../models/StoreGroup";
import { errorReturn, getCountryInfo } from "../../../utils/utils";
import _ from "lodash";
import { BuyerModel } from "../../../models/Buyer";

/**
 * Error에 대한 부분
 *
 * CodeDeliveryFailureException
 * InternalErrorException
 * InvalidEmailRoleAccessPolicyException
 * InvalidLambdaResponseException
 * InvalidParameterException
 * InvalidPasswordException
 * InvalidSmsRoleAccessPolicyException
 * InvalidSmsRoleTrustRelationshipException
 * NotAuthorizedException
 * ResourceNotFoundException
 * TooManyRequestsException
 * UnexpectedLambdaException
 * UserLambdaValidationException
 * UsernameExistsException
 */
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
                        role
                    } = param as EmailSignUpInput;

                    const zoneinfo = await getCountryInfo(timezone);

                    const _id = new ObjectId();

                    const userAttributes = makeUserAttributes(
                        username,
                        email,
                        zoneinfo,
                        _id,
                        phoneNumber
                    );

                    const result = await emailSignUp(
                        email,
                        password,
                        userAttributes,
                        role
                    );

                    const group = StoreGroupModel.makeDefaultGroup(_id);
                    if (role === "SELLER") {
                        const user = new UserModel({
                            _id,
                            sub: result.UserSub,
                            email,
                            zoneinfo,
                            loginInfos: [],
                            groupIds: [group._id],
                            roles: [role],
                            role
                        });
                        // TODO: EmailSignUp 하는 동시에 "기본 그룹"을 생성한다.
                        await user.save({ session });
                        await group.save({ session });
                    } else {
                        const buyer = new BuyerModel({
                            _id,
                            sub: result.UserSub,
                            email,
                            zoneinfo,
                            loginInfos: [],
                            roles: [role],
                            role
                        });
                        await buyer.save({
                            session
                        });
                    }
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
                    return await errorReturn(error, session);
                }
            }
        )
    }
};

const makeUserAttributes = (
    username: string,
    email: string,
    zoneinfo: any,
    _id: ObjectId,
    phoneNumber: string
) => {
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
    return userAttributes;
};

const emailSignUp = async (
    email: string,
    password: string,
    userAttributes: any[],
    role: UserRole
) => {
    const cognito = new CognitoIdentityServiceProvider();
    const result = await cognito
        .signUp({
            ClientId:
                (role === "SELLER"
                    ? process.env.COGNITO_CLIENT_ID
                    : process.env.COGNITO_CLIENT_ID_BUYER) || "",
            Username: email,
            Password: password,
            UserAttributes: userAttributes
        })
        .promise();
    return result;
};

export default resolvers;
