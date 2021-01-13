"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = void 0;
const aws_sdk_1 = require("aws-sdk");
exports.refreshToken = async (refreshToken, role) => {
    try {
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        // AccessToken, IdToken, TokenType, ExpiresIn 포함, RefreshToken은 미포함
        const result = await cognito
            .adminInitiateAuth({
            UserPoolId: (role === "SELLER"
                ? process.env.COGNITO_POOL_ID
                : process.env.COGNITO_POOL_ID_BUYER) || "",
            ClientId: (role === "SELLER"
                ? process.env.COGNITO_CLIENT_ID
                : process.env.COGNITO_CLIENT_ID_BUYER) || "",
            AuthFlow: "REFRESH_TOKEN_AUTH",
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        })
            .promise();
        const authResult = result.AuthenticationResult;
        if (!authResult) {
            throw result.$response.error;
        }
        return {
            ok: true,
            error: null,
            data: {
                idToken: authResult.IdToken || "",
                accessToken: authResult.AccessToken || "",
                refreshToken: authResult.RefreshToken || "",
                expDate: (authResult.ExpiresIn &&
                    new Date(authResult.ExpiresIn * 1000 + new Date().getTime())) ||
                    undefined
            }
        };
    }
    catch (error) {
        return {
            ok: false,
            error: error,
            data: null
        };
    }
};
//# sourceMappingURL=refreshToken.js.map