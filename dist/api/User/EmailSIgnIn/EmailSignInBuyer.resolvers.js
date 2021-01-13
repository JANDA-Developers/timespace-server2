"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSignInBuyerFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const decodeIdToken_1 = require("../../../utils/decodeIdToken");
const aws_sdk_1 = require("aws-sdk");
const User_1 = require("../../../models/User");
const mongodb_1 = require("mongodb");
exports.EmailSignInBuyerFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const { param: { email, password } } = args;
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
    try {
        const cognitoSignInResult = await cognito
            .adminInitiateAuth({
            UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
            ClientId: process.env.COGNITO_CLIENT_ID_BUYER || "",
            AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        })
            .promise();
        const { AuthenticationResult: authResult } = cognitoSignInResult;
        if (!authResult || !authResult.IdToken) {
            throw cognitoSignInResult.$response.error;
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
        const cognitoUser = await decodeIdToken_1.decodeKey(authResult.IdToken);
        // User Refresh Token, Access Token 두가지를 DB에 저장...
        if (!cognitoUser) {
            throw new apollo_server_1.ApolloError("INVALID_COGNITO_USER", "User Load Fail from cognito", {
                token: authResult.IdToken
            });
        }
        let existingUser = await User_1.UserModel.findOne({
            sub: cognitoUser.data.sub
        });
        if (!existingUser) {
            // DB에 User가 존재하지 않는다면
            // => DB에 해당 User를 저장함
            existingUser = new User_1.UserModel({
                _id: new mongodb_1.ObjectId(),
                sub: cognitoUser.data.sub,
                refreshToken: authResult.RefreshToken || "",
                refreshTokenLastUpdate: new Date(),
                zoneinfo: JSON.parse(cognitoUser.data.zoneinfo)
            });
        }
        else {
            existingUser.refreshToken = authResult.RefreshToken || "";
            existingUser.refreshTokenLastUpdate = new Date();
        }
        await existingUser.save({ session });
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
};
const resolvers = {
    Mutation: {
        EmailSignInBuyer: resolverFuncWrapper_1.defaultResolver(exports.EmailSignInBuyerFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=EmailSignInBuyer.resolvers.js.map