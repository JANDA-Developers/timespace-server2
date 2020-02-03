import { CognitoIdentityServiceProvider } from "aws-sdk";
import { BaseResponse } from "../types/graph";

export const refreshToken = async (
    refreshToken: string
): Promise<BaseResponse & {
    data: { idToken: string; refreshToken: string } | null;
}> => {
    try {
        const cognito = new CognitoIdentityServiceProvider();
        // AccessToken, IdToken, TokenType, ExpiresIn 포함, RefreshToken은 미포함
        const result = await cognito
            .adminInitiateAuth({
                UserPoolId: process.env.COGNITO_POOL_ID || "",
                ClientId: process.env.COGNITO_CLIENT_ID || "",
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
                refreshToken: authResult.RefreshToken || ""
            }
        };
    } catch (error) {
        return {
            ok: false,
            error: error,
            data: null
        };
    }
};
