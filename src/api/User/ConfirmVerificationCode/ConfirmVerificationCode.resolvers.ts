import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ConfirmVerificationCodeResponse,
    ConfirmVerificationCodeInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { UserModel } from "../../../models/User";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { BuyerModel } from "../../../models/Buyer";

export const ConfirmVerificationCodeFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ConfirmVerificationCodeResponse> => {
    try {
        const { param }: { param: ConfirmVerificationCodeInput } = args;
        const { code, email, role } = param;
        let user: any;
        if (role === "SELLER") {
            user = await UserModel.findOne(
                {
                    email
                },
                {
                    sub: 1
                }
            ).exec();
        } else {
            user = await BuyerModel.findOne(
                {
                    email
                },
                {
                    sub: 1
                }
            ).exec();
        }
        if (!user) {
            throw new ApolloError(
                "해당 Email로 가입된 ID가 없습니다. 계정을 생성해주세요.",
                ERROR_CODES.UNEXIST_USER
            );
        }
        const userSub = user.sub;

        // 참고자료: https://m.blog.naver.com/oksk0302/220986019426
        const cognito = new CognitoIdentityServiceProvider();
        await cognito
            .confirmSignUp({
                ClientId:
                    (role === "SELLER" && process.env.COGNITO_CLIENT_ID) ||
                    process.env.COGNITO_CLIENT_ID_BUYER ||
                    "",
                ConfirmationCode: code,
                Username: userSub
            })
            .promise();

        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        ConfirmVerificationCode: defaultResolver(ConfirmVerificationCodeFunc)
    }
};
export default resolvers;
