import { Resolvers } from "../../../types/resolvers";
import {
    EmailSignInMutationArgs,
    EmailSignInResponse
} from "../../../types/graph";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ErrCls } from "../../../models/Err";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";

const resolvers: Resolvers = {
    Mutation: {
        EmailSignIn: defaultResolver(
            async (
                insideLog: Array<any>,
                __: any,
                { param }: EmailSignInMutationArgs
            ): Promise<EmailSignInResponse> => {
                // Amazon Cognito creates a session which includes the id, access, and refresh tokens of an authenticated user.
                try {
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
                    if (!result.AuthenticationResult) {
                        throw ErrCls.makeErr("102", "로그인 실패");
                    }
                    insideLog.push("되나 안되나?");
                    insideLog.push("잘 되는건가?");
                    // User Refresh Token, Access Token 두가지를 DB에 저장...
                    return {
                        ok: true,
                        error: null,
                        data: {
                            token: result.AuthenticationResult.IdToken || "",
                            expiresIn:
                                (result.AuthenticationResult.ExpiresIn || 0) *
                                1000
                        }
                    };
                } catch (error) {
                    return {
                        ok: false,
                        error: JSON.parse(error.message),
                        data: null
                    };
                }
            }
        )
    }
};
export default resolvers;
