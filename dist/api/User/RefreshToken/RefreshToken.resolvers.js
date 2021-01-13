"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const apollo_server_1 = require("apollo-server");
const refreshToken_1 = require("../../../utils/refreshToken");
const User_1 = require("../../../models/User");
const Buyer_1 = require("../../../models/Buyer");
const resolvers = {
    Mutation: {
        RefreshToken: resolverFuncWrapper_1.defaultResolver(async ({ parent, args, context: { req }, info }, stack) => {
            const { param: { role } } = args;
            if (role === "SELLER") {
                const token = req.get("X-JWT");
                const { cognitoUser } = req;
                if (!token) {
                    throw new apollo_server_1.ApolloError("토큰값이 존재하지 않습니다.", "UNDEFINED_TOKEN", { token });
                }
                if (token === "TokenExpiredError") {
                    throw new apollo_server_1.ApolloError("만료된 토큰입니다. 다시 로그인 해주세요", "TOKEN_EXPIRED_ERROR");
                }
                const user = await User_1.UserModel.findBySub(cognitoUser.sub);
                const authResult = await refreshToken_1.refreshToken(user.refreshToken, "SELLER");
                if (!authResult.ok || !authResult.data) {
                    throw authResult.error;
                }
                user.refreshToken = authResult.data.refreshToken;
                stack.push({
                    refreshToken: user.refreshToken,
                    authResult
                });
                return {
                    ok: true,
                    error: null,
                    data: {
                        ...authResult.data,
                        expDate: authResult.data.expDate || null
                    }
                };
            }
            else {
                const tokenB = req.get("X-JWT-B") || req.headers["x-jwt-b"];
                const { cognitoBuyer } = req;
                if (!tokenB) {
                    throw new apollo_server_1.ApolloError("토큰값이 존재하지 않습니다.", "UNDEFINED_TOKEN", { tokenB });
                }
                if (tokenB === "TokenExpiredError") {
                    throw new apollo_server_1.ApolloError("만료된 토큰입니다. 다시 로그인 해주세요", "TOKEN_EXPIRED_ERROR");
                }
                const buyer = await Buyer_1.BuyerModel.findBySub(cognitoBuyer.sub);
                const authResult = await refreshToken_1.refreshToken(buyer.refreshToken, "BUYER");
                if (!authResult.ok || !authResult.data) {
                    throw authResult.error;
                }
                buyer.refreshToken = authResult.data.refreshToken;
                stack.push({
                    refreshToken: buyer.refreshToken,
                    authResult
                });
                return {
                    ok: true,
                    error: null,
                    data: {
                        ...authResult.data,
                        expDate: authResult.data.expDate || null
                    }
                };
            }
        })
    }
};
exports.default = resolvers;
//# sourceMappingURL=RefreshToken.resolvers.js.map