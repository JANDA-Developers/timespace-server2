"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
const mongodb_1 = require("mongodb");
const typegoose_1 = require("@typegoose/typegoose");
const StoreGroup_1 = require("../../../models/StoreGroup");
const utils_1 = require("../../../utils/utils");
const Buyer_1 = require("../../../models/Buyer");
const smsFunction_1 = require("../../../utils/smsFunction");
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
const resolvers = {
    Mutation: {
        EmailSignUp: resolverFuncWrapper_1.defaultResolver(async ({ args: { param } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { username, email, password, phoneNumber, timezone, role, company } = param;
                const zoneinfo = await utils_1.getCountryInfo(timezone);
                const _id = new mongodb_1.ObjectId();
                const userAttributes = makeUserAttributes(username, email, zoneinfo, _id, phoneNumber);
                const result = await emailSignUp(email, password, userAttributes, role);
                const group = StoreGroup_1.StoreGroupModel.makeDefaultGroup(_id);
                const confirmationCode = Math.floor(Math.random() * 1000000)
                    .toString()
                    .padStart(6, "0");
                if (role === "SELLER") {
                    const user = new User_1.UserModel({
                        _id,
                        sub: result.UserSub,
                        email,
                        zoneinfo,
                        loginInfos: [],
                        groupIds: [group._id],
                        roles: [role],
                        role
                    });
                    user.confirmationCode = confirmationCode;
                    await smsFunction_1.sendSMS({
                        receivers: phoneNumber,
                        msg: `회원가입 인증코드는 [${confirmationCode}] 입니다.`
                    });
                    // EmailSignUp 하는 동시에 "기본 그룹"을 생성한다.
                    await user.save({ session });
                    await group.save({ session });
                }
                else {
                    const buyer = new Buyer_1.BuyerModel({
                        _id,
                        sub: result.UserSub,
                        email,
                        zoneinfo,
                        loginInfos: [],
                        roles: [role],
                        role,
                        company
                    });
                    buyer.confirmationCode = confirmationCode;
                    await smsFunction_1.sendSMS({
                        receivers: phoneNumber,
                        msg: `회원가입 인증코드는 [${confirmationCode}] 입니다.`
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
                        CodeDeliveryDetails: (result.CodeDeliveryDetails && {
                            AttributeName: result.CodeDeliveryDetails
                                .AttributeName || null,
                            DeliveryMedium: result.CodeDeliveryDetails
                                .DeliveryMedium || null,
                            Destination: result.CodeDeliveryDetails
                                .Destination || null
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
        })
    }
};
const makeUserAttributes = (username, email, zoneinfo, _id, phoneNumber) => {
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
    return userAttributes;
};
const emailSignUp = async (email, password, userAttributes, role) => {
    const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
    const ClientId = (role === "SELLER"
        ? process.env.COGNITO_CLIENT_ID
        : process.env.COGNITO_CLIENT_ID_BUYER) || "";
    const result = await cognito
        .signUp({
        ClientId,
        Username: email,
        Password: password,
        UserAttributes: userAttributes
    })
        .promise();
    return result;
};
exports.default = resolvers;
//# sourceMappingURL=EmailSignUp.resolvers.js.map