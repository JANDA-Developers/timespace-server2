import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { EmailSignInBuyerResponse, EmailSignInBuyerInput } from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { decodeKey } from "../../../utils/decodeIdToken";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";

export const EmailSignInBuyerFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<EmailSignInBuyerResponse> => {
    const {
        param: { email, password }
    }: { param: EmailSignInBuyerInput } = args;
    const session = await mongoose.startSession();
    session.startTransaction();
    const cognito = new CognitoIdentityServiceProvider();
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
        if (!existingUser) {
            // DB에 User가 존재하지 않는다면
            // => DB에 해당 User를 저장함
            existingUser = new UserModel({
                _id: new ObjectId(),
                sub: cognitoUser.data.sub,
                refreshToken: authResult.RefreshToken || "",
                refreshTokenLastUpdate: new Date(),
                zoneinfo: JSON.parse(cognitoUser.data.zoneinfo)
            });
        } else {
            existingUser.refreshToken = authResult.RefreshToken || "";
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
                    (authResult.ExpiresIn || 0) * 1000 + new Date().getTime()
                )
            }
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        EmailSignInBuyer: defaultResolver(EmailSignInBuyerFunc)
    }
};
export default resolvers;
