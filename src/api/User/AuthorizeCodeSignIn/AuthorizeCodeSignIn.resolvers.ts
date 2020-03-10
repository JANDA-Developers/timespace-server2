/* eslint-disable @typescript-eslint/camelcase */
import { ApolloError } from "apollo-server";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    AuthorizeCodeSignInResponse,
    AuthorizeCodeSignInInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import axios from "axios";
import { getCognitoUser } from "../../../utils/decodeIdToken";
import { UserModel, UserCls } from "../../../models/User";
import { ObjectId } from "mongodb";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { StoreGroupModel } from "../../../models/StoreGroup";

export const AuthorizeCodeSignInFunc = async (
    { args },
    stack: any[]
): Promise<AuthorizeCodeSignInResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            param: { authorizeCode, redirectUri }
        }: { param: AuthorizeCodeSignInInput } = args;
        stack.push("뀨?");

        const result = await getTokenFromCognito(authorizeCode, redirectUri);

        const {
            error,
            access_token,
            refresh_token,
            id_token,
            expires_in
        } = result;

        if (error) {
            stack.push(result);
            throw new ApolloError(error, ERROR_CODES.INVALID_VALUES, { error });
        }

        const cognitoUser = await getCognitoUser(id_token);
        if (typeof cognitoUser === "string" || !cognitoUser) {
            throw new ApolloError(
                "존재하지 않는 CognitoUser. 다시 가입해주세요 - 가입 실패"
            );
        }

        const { user, exists } = await getUser(cognitoUser.sub);
        udpateRefreshToken(user, refresh_token);
        let isInitiated =
            exists &&
            (cognitoUser.zoneinfo !== undefined ||
                cognitoUser.phone_number !== undefined ||
                cognitoUser.name !== undefined);

        if (user) {
            if (new ObjectId(cognitoUser["custom:_id"]).equals(user._id)) {
                isInitiated = true;
            }
        }
        if (!exists) {
            const defaultGroup = await makeDefaultGroup(user._id).save({
                session
            });
            user.groupIds = [defaultGroup._id];
        }
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: {
                accessToken: access_token,
                // refreshToken: refresh_token,
                token: id_token,
                expiresIn: new Date(Date.now() + expires_in * 1000),
                isInitiated
            }
        };
    } catch (error) {
        stack.push("Catch");
        return await errorReturn(error, session);
    }
};

const getUser = async (
    sub: string
): Promise<{ user: DocumentType<UserCls>; exists: boolean }> => {
    const user = await UserModel.findOne({
        sub
    });
    if (!user) {
        return {
            user: new UserModel({
                sub,
                _id: new ObjectId(),
                roles: ["SELLER"]
            }),
            exists: false
        };
    }
    return { user, exists: true };
};

const udpateRefreshToken = (
    user: DocumentType<UserCls>,
    refreshToken: string
) => {
    user.refreshToken = refreshToken;
    user.refreshTokenLastUpdate = new Date();
};

const makeDefaultGroup = (id: string | ObjectId) => {
    return StoreGroupModel.makeDefaultGroup(id);
};

const makeQuery = (args: {
    grant_type: string;
    client_id: string;
    code: string;
    redirect_uri: string;
}): string => {
    const query: string[] = [];
    for (const key in args) {
        const value = args[key];
        query.push(`${key}=${value}`);
    }
    return query.join("&");
};

const getTokenFromCognito = async (
    authorizeCode: string,
    redirectUri: string
) => {
    const result = await axios.post(
        `https://auth-seller.dev-ticket-yeulbep6p.stayjanda.cloud/oauth2/token`,
        makeQuery({
            grant_type: "authorization_code",
            client_id: process.env.COGNITO_CLIENT_ID || "",
            code: authorizeCode,
            redirect_uri: redirectUri
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

    return {
        error,
        access_token,
        refresh_token,
        id_token,
        expires_in
    };
};

const resolvers: Resolvers = {
    Query: {
        AuthorizeCodeSignIn: defaultResolver(AuthorizeCodeSignInFunc)
    }
};

export default resolvers;
