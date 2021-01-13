"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
const decodeIdToken_1 = require("../../../utils/decodeIdToken");
const mongodb_1 = require("mongodb");
const apollo_server_1 = require("apollo-server");
const utils_1 = require("../../../utils/utils");
const typegoose_1 = require("@typegoose/typegoose");
const Buyer_1 = require("../../../models/Buyer");
const resolvers = {
    Mutation: {
        EmailSignIn: resolverFuncWrapper_1.defaultResolver(async ({ args: { param }, context: { req } }, stack) => {
            // Amazon Cognito creates a session which includes the id, access, and refresh tokens of an authenticated user.
            const { email, password, role } = param;
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const result = await cognitoSignIn(email, password, role);
                const { AuthenticationResult: authResult } = result;
                if (!authResult || !authResult.IdToken) {
                    throw result.$response.error;
                }
                /*
                 * ======================================================================================================================
                 *
                 * 이하 User 로그인 성공
                 *
                 * ======================================================================================================================
                 */
                stack.push(authResult);
                // TODO: Token Decode 해서 sub 가져옴
                const cognitoUser = role === "SELLER"
                    ? await decodeIdToken_1.decodeKey(authResult.IdToken)
                    : await decodeIdToken_1.decodeKeyForBuyer(authResult.IdToken);
                // User Refresh Token, Access Token 두가지를 DB에 저장...
                if (!cognitoUser) {
                    throw new apollo_server_1.ApolloError("INVALID_COGNITO_USER", "User Load Fail from cognito", {
                        token: authResult.IdToken
                    });
                }
                const signInInfo = {
                    idToken: authResult.IdToken,
                    expiresIn: (authResult.ExpiresIn || 0) * 1000 +
                        Date.now(),
                    accessToken: authResult.AccessToken
                };
                if (role === "SELLER") {
                    const user = await User_1.UserModel.findOne({
                        sub: cognitoUser.data.sub
                    });
                    if (!user) {
                        new User_1.UserModel({
                            _id: new mongodb_1.ObjectId(),
                            sub: cognitoUser.data.sub,
                            refreshToken: authResult.RefreshToken || "",
                            refreshTokenLastUpdate: new Date(),
                            zoneinfo: JSON.parse(cognitoUser.data.zoneinfo),
                            roles: [role]
                        }).save({ session });
                    }
                    else {
                        user.refreshToken = authResult.RefreshToken || "";
                        user.refreshTokenLastUpdate = new Date();
                        await user.save({ session });
                    }
                    req.session.seller = signInInfo;
                }
                else {
                    const user = await Buyer_1.BuyerModel.findOne({
                        sub: cognitoUser.data.sub
                    });
                    if (!user) {
                        new Buyer_1.BuyerModel({
                            _id: new mongodb_1.ObjectId(),
                            sub: cognitoUser.data.sub,
                            refreshToken: authResult.RefreshToken || "",
                            refreshTokenLastUpdate: new Date(),
                            zoneinfo: JSON.parse(cognitoUser.data.zoneinfo)
                        }).save({ session });
                    }
                    else {
                        user.refreshToken = authResult.RefreshToken || "";
                        user.refreshTokenLastUpdate = new Date();
                        await user.save({ session });
                    }
                    req.session.buyer = signInInfo;
                }
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        })
    }
};
const cognitoSignIn = async (email, password, role) => {
    const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
    const UserPoolId = (role === "BUYER" && process.env.COGNITO_POOL_ID_BUYER) ||
        process.env.COGNITO_POOL_ID ||
        "";
    const ClientId = (role === "BUYER" && process.env.COGNITO_CLIENT_ID_BUYER) ||
        process.env.COGNITO_CLIENT_ID ||
        "";
    return await cognito
        .adminInitiateAuth({
        UserPoolId,
        ClientId,
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    })
        .promise();
};
exports.default = resolvers;
//# sourceMappingURL=EmailSignIn.resolvers.js.map