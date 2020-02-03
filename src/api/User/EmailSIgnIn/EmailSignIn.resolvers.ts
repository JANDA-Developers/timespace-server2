import { Resolvers } from "../../../types/resolvers";
import {
    EmailSignInMutationArgs,
    EmailSignInResponse
} from "../../../types/graph";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { UserModel, LoggedInInfo } from "../../../models/User";
import { decodeKey } from "../../../utils/decodeIdToken";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    Mutation: {
        EmailSignIn: defaultResolver(
            async (
                insideLog: Array<any>,
                __: any,
                { param }: EmailSignInMutationArgs,
                { req }
            ): Promise<EmailSignInResponse> => {
                // Amazon Cognito creates a session which includes the id, access, and refresh tokens of an authenticated user.
                const { email, password } = param;
                const cognito = new CognitoIdentityServiceProvider();
                const result = await cognito
                    .adminInitiateAuth({
                        UserPoolId: process.env.COGNITO_POOL_ID || "",
                        ClientId: process.env.COGNITO_CLIENT_ID || "",
                        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                        AuthParameters: {
                            USERNAME: email,
                            PASSWORD: password
                        }
                    })
                    .promise();
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

                insideLog.push(authResult);
                // TODO: Token Decode 해서 sub 가져옴
                const cognitoUser: any = await decodeKey(authResult.IdToken);
                // User Refresh Token, Access Token 두가지를 DB에 저장...
                let existingUser = await UserModel.findOne({
                    sub: cognitoUser.sub
                });
                if (!existingUser) {
                    // TODO DB에 User가 존재하지 않는다면
                    // => DB에 해당 User를 저장함
                    const tokenInfos: LoggedInInfo = {
                        accessToken: authResult.AccessToken || "",
                        idToken: authResult.IdToken || "",
                        refreshToken: authResult.RefreshToken || "",
                        expiryDate: authResult.ExpiresIn || 3600,
                        ip: req.ip,
                        os: req.headers["user-agent"]
                    };
                    existingUser = await UserModel.create({
                        _id: new ObjectId(),
                        sub: cognitoUser.sub,
                        loginInfos: [tokenInfos]
                    });
                }

                return {
                    ok: true,
                    error: null,
                    data: {
                        token: authResult.IdToken || "",
                        expiresIn: (authResult.ExpiresIn || 0) * 1000
                    }
                };
            }
        )
    }
};
export default resolvers;
