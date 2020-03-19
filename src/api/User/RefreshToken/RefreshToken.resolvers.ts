import { Resolvers } from "../../../types/resolvers";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { ApolloError } from "apollo-server";
import { refreshToken } from "../../../utils/refreshToken";
import { RefreshTokenResponse, RefreshTokenMutationArgs } from "GraphType";
import { UserModel } from "../../../models/User";
import { BuyerModel } from "../../../models/Buyer";

const resolvers: Resolvers = {
    Mutation: {
        RefreshToken: defaultResolver(
            async (
                { parent, args, context: { req }, info },
                stack: any[]
            ): Promise<RefreshTokenResponse> => {
                const {
                    param: { role }
                } = args as RefreshTokenMutationArgs;

                if (role === "SELLER") {
                    const token: string | undefined = req.get("X-JWT");
                    const { cognitoUser } = req;
                    if (!token) {
                        throw new ApolloError(
                            "토큰값이 존재하지 않습니다.",
                            "UNDEFINED_TOKEN",
                            { token }
                        );
                    }
                    if (token === "TokenExpiredError") {
                        throw new ApolloError(
                            "만료된 토큰입니다. 다시 로그인 해주세요",
                            "TOKEN_EXPIRED_ERROR"
                        );
                    }
                    const user = await UserModel.findBySub(cognitoUser.sub);

                    const authResult = await refreshToken(
                        user.refreshToken,
                        "SELLER"
                    );
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
                        token: authResult.data.idToken || ""
                    };
                } else {
                    const tokenB: string | undefined =
                        req.get("X-JWT-B") || req.headers["x-jwt-b"];

                    const { cognitoBuyer } = req;
                    if (!tokenB) {
                        throw new ApolloError(
                            "토큰값이 존재하지 않습니다.",
                            "UNDEFINED_TOKEN",
                            { tokenB }
                        );
                    }
                    if (tokenB === "TokenExpiredError") {
                        throw new ApolloError(
                            "만료된 토큰입니다. 다시 로그인 해주세요",
                            "TOKEN_EXPIRED_ERROR"
                        );
                    }
                    const buyer = await BuyerModel.findBySub(cognitoBuyer.sub);

                    const authResult = await refreshToken(
                        buyer.refreshToken,
                        "BUYER"
                    );
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
                        token: authResult.data.idToken || ""
                    };
                }
            }
        )
    }
};
export default resolvers;
