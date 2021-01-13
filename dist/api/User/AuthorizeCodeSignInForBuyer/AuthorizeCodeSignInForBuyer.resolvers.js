"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizeCodeSignInForBuyerFunc = void 0;
/* eslint-disable @typescript-eslint/camelcase */
const apollo_server_1 = require("apollo-server");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const axios_1 = __importDefault(require("axios"));
const decodeIdToken_1 = require("../../../utils/decodeIdToken");
const User_1 = require("../../../models/User");
const mongodb_1 = require("mongodb");
const typegoose_1 = require("@typegoose/typegoose");
const StoreGroup_1 = require("../../../models/StoreGroup");
exports.AuthorizeCodeSignInForBuyerFunc = async ({ args }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { param: { authorizeCode, redirectUri } } = args;
        stack.push("뀨?");
        const result = await getTokenFromCognito(authorizeCode, redirectUri);
        const { error, access_token, refresh_token, id_token, expires_in } = result;
        if (error) {
            stack.push(result);
            throw new apollo_server_1.ApolloError(error, values_1.ERROR_CODES.INVALID_VALUES, { error });
        }
        const cognitoUser = await decodeIdToken_1.getCognitoUser(id_token);
        if (typeof cognitoUser === "string" || !cognitoUser) {
            throw new apollo_server_1.ApolloError("존재하지 않는 CognitoUser. 다시 가입해주세요 - 가입 실패");
        }
        const { user, exists } = await getUser(cognitoUser.sub);
        udpateRefreshToken(user, refresh_token);
        let isInitiated = exists &&
            user.zoneinfo !== undefined &&
            user.phone_number !== undefined;
        if (user) {
            if (new mongodb_1.ObjectId(cognitoUser["custom:_id"]).equals(user._id)) {
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
    }
    catch (error) {
        stack.push("Catch");
        return await utils_1.errorReturn(error, session);
    }
};
const getUser = async (sub) => {
    const user = await User_1.UserModel.findOne({
        sub
    });
    if (!user) {
        return {
            user: new User_1.UserModel({
                sub,
                _id: new mongodb_1.ObjectId(),
                roles: ["SELLER"]
            }),
            exists: false
        };
    }
    return { user, exists: true };
};
const udpateRefreshToken = (user, refreshToken) => {
    user.refreshToken = refreshToken;
    user.refreshTokenLastUpdate = new Date();
};
const makeDefaultGroup = (id) => {
    return StoreGroup_1.StoreGroupModel.makeDefaultGroup(id);
};
const makeQuery = (args) => {
    const query = [];
    for (const key in args) {
        const value = args[key];
        query.push(`${key}=${value}`);
    }
    return query.join("&");
};
const getTokenFromCognito = async (authorizeCode, redirectUri) => {
    const result = await axios_1.default.post(`https://auth-seller.dev-ticket-yeulbep6p.stayjanda.cloud/oauth2/token`, makeQuery({
        grant_type: "authorization_code",
        client_id: process.env.COGNITO_CLIENT_ID_BUYER || "",
        code: authorizeCode,
        redirect_uri: redirectUri
    }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    const { error, access_token, refresh_token, id_token, expires_in } = result.data;
    return {
        error,
        access_token,
        refresh_token,
        id_token,
        expires_in
    };
};
const resolvers = {
    Query: {
        AuthorizeCodeSignInForBuyer: resolverFuncWrapper_1.defaultResolver(exports.AuthorizeCodeSignInForBuyerFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=AuthorizeCodeSignInForBuyer.resolvers.js.map