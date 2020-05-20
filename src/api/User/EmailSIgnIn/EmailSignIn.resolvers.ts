import { Resolvers } from "../../../types/resolvers";
import {
    EmailSignInMutationArgs,
    EmailSignInResponse,
    UserRole
} from "GraphType";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import { decodeKey, decodeKeyForBuyer } from "../../../utils/decodeIdToken";
import { ObjectId } from "mongodb";
import { ApolloError } from "apollo-server";
import { errorReturn } from "../../../utils/utils";
import { mongoose } from "@typegoose/typegoose";
import { BuyerModel } from "../../../models/Buyer";

const resolvers: Resolvers = {
    Mutation: {
        EmailSignIn: defaultResolver(
            async (
                {
                    args: { param },
                    context: { req }
                }: { parent: any; args: EmailSignInMutationArgs; context: any },
                stack: Array<any>
            ): Promise<EmailSignInResponse> => {
                // Amazon Cognito creates a session which includes the id, access, and refresh tokens of an authenticated user.
                const { email, password, role } = param;
                const session = await mongoose.startSession();
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
                    const cognitoUser =
                        role === "SELLER"
                            ? await decodeKey(authResult.IdToken)
                            : await decodeKeyForBuyer(authResult.IdToken);
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
                    const signInInfo = {
                        idToken: authResult.IdToken,
                        expiresIn:
                            ((authResult.ExpiresIn as number) || 0) * 1000 +
                            Date.now(),
                        accessToken: authResult.AccessToken
                    };
                    if (role === "SELLER") {
                        const user = await UserModel.findOne({
                            sub: cognitoUser.data.sub
                        });
                        if (!user) {
                            new UserModel({
                                _id: new ObjectId(),
                                sub: cognitoUser.data.sub,
                                refreshToken: authResult.RefreshToken || "",
                                refreshTokenLastUpdate: new Date(),
                                zoneinfo: JSON.parse(cognitoUser.data.zoneinfo),
                                roles: [role]
                            }).save({ session });
                        } else {
                            user.refreshToken = authResult.RefreshToken || "";
                            user.refreshTokenLastUpdate = new Date();

                            await user.save({ session });
                        }
                        req.session.seller = signInInfo;
                    } else {
                        const user = await BuyerModel.findOne({
                            sub: cognitoUser.data.sub
                        });
                        if (!user) {
                            new BuyerModel({
                                _id: new ObjectId(),
                                sub: cognitoUser.data.sub,
                                refreshToken: authResult.RefreshToken || "",
                                refreshTokenLastUpdate: new Date(),
                                zoneinfo: JSON.parse(cognitoUser.data.zoneinfo)
                            }).save({ session });
                        } else {
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
                } catch (error) {
                    return await errorReturn(error, session);
                }
            }
        )
    }
};

const cognitoSignIn = async (
    email: string,
    password: string,
    role: UserRole
) => {
    const cognito = new CognitoIdentityServiceProvider();
    const UserPoolId =
        (role === "BUYER" && process.env.COGNITO_POOL_ID_BUYER) ||
        process.env.COGNITO_POOL_ID ||
        "";
    const ClientId =
        (role === "BUYER" && process.env.COGNITO_CLIENT_ID_BUYER) ||
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

export default resolvers;
