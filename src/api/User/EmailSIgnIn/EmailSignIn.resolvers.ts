import { Resolvers } from "../../../types/resolvers";
import { EmailSignInMutationArgs, EmailSignInResponse } from "GraphType";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { UserModel, LoggedInInfo } from "../../../models/User";
import { decodeKey } from "../../../utils/decodeIdToken";
import { ObjectId } from "mongodb";
import { ApolloError } from "apollo-server";
import { getIP, errorReturn } from "../../../utils/utils";
import { mongoose } from "@typegoose/typegoose";

const resolvers: Resolvers = {
    Mutation: {
        EmailSignIn: defaultResolver(
            async (
                {
                    args: { param },
                    context: { req }
                }: { parent: any; args: EmailSignInMutationArgs; context: any },
                insideLog: Array<any>
            ): Promise<EmailSignInResponse> => {
                // Amazon Cognito creates a session which includes the id, access, and refresh tokens of an authenticated user.
                const { email, password } = param;
                const cognito = new CognitoIdentityServiceProvider();
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
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
                    const cognitoUser = await decodeKey(authResult.IdToken);
                    // User Refresh Token, Access Token 두가지를 DB에 저장...
                    if (!cognitoUser) {
                        throw new ApolloError(
                            "INVALID_COGNITO_USER",
                            "User Load Fail from cognito",
                            {
                                token: authResult.IdToken
                            }
                        );
                    }
                    let existingUser = await UserModel.findOne({
                        sub: cognitoUser.data.sub
                    });
                    const tokenInfos: LoggedInInfo = {
                        accessToken: authResult.AccessToken || "",
                        idToken: authResult.IdToken || "",
                        expiryDate: authResult.ExpiresIn || 3600,
                        ip: getIP(req)[0],
                        os: req.headers["user-agent"]
                    };
                    if (!existingUser) {
                        // TODO DB에 User가 존재하지 않는다면
                        // => DB에 해당 User를 저장함
                        existingUser = new UserModel({
                            _id: new ObjectId(),
                            sub: cognitoUser.data.sub,
                            refreshToken: authResult.RefreshToken || "",
                            refreshTokenLastUpdate: new Date(),
                            loginInfos: [tokenInfos],
                            zoneinfo: JSON.parse(cognitoUser.data.zoneinfo)
                        });
                    } else {
                        existingUser.refreshToken =
                            authResult.RefreshToken || "";
                        existingUser.refreshTokenLastUpdate = new Date();
                    }
                    await existingUser.save({ session });

                    await session.commitTransaction();
                    session.endSession();

                    return {
                        ok: true,
                        error: null,
                        data: {
                            token: authResult.IdToken || "",
                            expiresIn: new Date(
                                (authResult.ExpiresIn || 0) * 1000 +
                                    new Date().getTime()
                            )
                        }
                    };
                } catch (error) {
                    return await errorReturn(error, session);
                }
            }
        )
    }
};
export default resolvers;
