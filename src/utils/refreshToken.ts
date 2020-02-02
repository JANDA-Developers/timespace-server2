import { UserModel } from "../models/User";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ErrCls } from "../models/Err";

export const refreshToken = async (
    userSub: string,
    idToken: string
): Promise<any> => {
    try {
        const user = await UserModel.findBySub(userSub);

        const tokens = user.loginInfos.find(v => v.idToken === idToken);
        if (!tokens) {
            throw ErrCls.makeErr("103", "로그인이 필요합니다");
        }
        const cognito = new CognitoIdentityServiceProvider();
        const result = await cognito
            .adminInitiateAuth({
                UserPoolId: process.env.COGNITO_POOL_ID || "",
                ClientId: process.env.COGNITO_CLIENT_ID || "",
                AuthFlow: "REFRESH_TOKEN_AUTH",
                AuthParameters: {
                    REFRESH_TOKEN: tokens.refreshToken
                }
            })
            .promise();
        return result;
    } catch (error) {
        return "";
    }
};
