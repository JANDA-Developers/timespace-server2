import { Resolvers } from "../../../types/resolvers";
import {
    EmailSignInMutationArgs,
    EmailSignInResponse
} from "../../../types/graph";
import { fmtLog } from "../../../logger";
import { CognitoIdentityServiceProvider } from "aws-sdk";

const resolvers: Resolvers = {
    Mutation: {
        EmailSignIn: async (
            __: any,
            { param }: EmailSignInMutationArgs,
            { req }
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

                fmtLog("info", {
                    who: "admin",
                    data: result
                });
                return {
                    ok: true,
                    error: null,
                    data: null
                };
            } catch (error) {
                const { code, msg } = JSON.parse(error.message);
                return {
                    ok: false,
                    error: {
                        code,
                        msg
                    },
                    data: null
                };
            }
        }
    }
};
export default resolvers;
