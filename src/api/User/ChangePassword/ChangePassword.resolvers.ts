import { ApolloError } from "apollo-server";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { ChangePasswordResponse, ChangePasswordInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { refreshToken } from "../../../utils/refreshToken";
import { UserModel } from "../../../models/User";

export const ChangePasswordFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ChangePasswordResponse> => {
    try {
        const { cognitoUser, accessToken } = req;
        const user = await UserModel.findBySub(cognitoUser.sub);
        const { param }: { param: ChangePasswordInput } = args;
        validateParam(param);

        const cognito = new CognitoIdentityServiceProvider();

        const changeResult = await cognito
            .changePassword({
                AccessToken: accessToken,
                PreviousPassword: param.oldPw,
                ProposedPassword: param.newPw
            })
            .promise();
        if (changeResult.$response.error) {
            throw changeResult.$response.error;
        }
        const { error, data } = await refreshToken(user.refreshToken, "SELLER");
        if (!data) {
            throw error;
        }

        return {
            ok: true,
            error: null,
            data: data.idToken
        };

        /**
         * ============================================================
         *
         * Your Code Here~!
         *
         * ============================================================
         */
    } catch (error) {
        return await errorReturn(error);
    }
};

const validateParam = (param: ChangePasswordInput) => {
    const { newPw, newPwRe } = param;
    if (newPw !== newPwRe) {
        throw new ApolloError(
            "새 패스워드가 서로 일치하지 않습니다.",
            ERROR_CODES.NEW_PASSWORD_COMPARE_ERROR
        );
    }
};

const resolvers: Resolvers = {
    Mutation: {
        ChangePassword: defaultResolver(privateResolver(ChangePasswordFunc))
    }
};
export default resolvers;
