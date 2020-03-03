/* eslint-disable @typescript-eslint/camelcase */
import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    AuthorizeCodeSignInResponse,
    AuthorizeCodeSignInInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import axios from "axios";

export const AuthorizeCodeSignInFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<AuthorizeCodeSignInResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            param: { authorizeCode, role }
        }: { param: AuthorizeCodeSignInInput } = args;
        const result = await axios.post(
            "https://auth2.dev-ticket-yeulbep6p.stayjanda.cloud/oauth2/token",
            JSON.stringify({
                grant_type: "authorization_code",
                client_id: process.env.COGNITO_CLIENT_ID,
                code: authorizeCode,
                redirect_uri:
                    "https://dev-ticket-yeulbep6p.stayjanda.cloud/auth/request"
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        const {
            error,
            access_token,
            refresh_token,
            id_token,
            expires_in
        } = result.data;
        if (error) {
            throw new ApolloError(error, ERROR_CODES.INVALID_VALUES, { error });
        }
        return {
            ok: true,
            error: null,
            data: {
                accessToken: access_token,
                refreshToken: refresh_token,
                token: id_token,
                expiresIn: new Date(Date.now() + expires_in * 1000),
                role
            }
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Query: {
        AuthorizeCodeSignIn: defaultResolver(AuthorizeCodeSignInFunc)
    }
};
export default resolvers;
