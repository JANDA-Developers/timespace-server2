import { CognitoIdentityServiceProvider } from "aws-sdk";
import { BaseResponse, UserRole } from "GraphType";

export const refreshToken = async (
    refreshToken: string,
    role: UserRole
): Promise<BaseResponse & {
    data: {
        idToken: string;
        refreshToken: string;
        accessToken: string;
        expDate?: Date;
    } | null;
}> => {
    try {
        const cognito = new CognitoIdentityServiceProvider();
        // AccessToken, IdToken, TokenType, ExpiresIn 포함, RefreshToken은 미포함
        const result = await cognito
            .adminInitiateAuth({
                UserPoolId:
                    (role === "SELLER"
                        ? process.env.COGNITO_POOL_ID
                        : process.env.COGNITO_POOL_ID_BUYER) || "",
                ClientId:
                    (role === "SELLER"
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
                expDate:
                    (authResult.ExpiresIn &&
                        new Date(
                            authResult.ExpiresIn * 1000 + new Date().getTime()
                        )) ||
                    undefined
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
