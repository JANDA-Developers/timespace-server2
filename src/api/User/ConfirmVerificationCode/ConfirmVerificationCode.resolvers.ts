import { mongoose } from "@typegoose/typegoose";
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

export const ConfirmVerificationCodeFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ConfirmVerificationCodeResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { param }: { param: ConfirmVerificationCodeInput } = args;
        const { code, email } = param;
        const user = await UserModel.findOne(
            {
                email
            },
            {
                sub: 1
            }
        )
            .session(session)
            .exec();
        if (!user) {
            throw new ApolloError(
                "해당 Email로 가입된 ID가 없습니다. 계정을 생성해주세요.",
                ERROR_CODES.UNEXIST_USER
            );
        }
        const userSub = user.sub;

        const cognito = new CognitoIdentityServiceProvider();
        // TODO: Sms Code로 가입 인증 변경 코드 작성
        // 참고자료: https://m.blog.naver.com/oksk0302/220986019426

        const confirmResult = await cognito
            .confirmSignUp({
                ClientId: process.env.COGNITO_CLIENT_ID || "",
                ConfirmationCode: code,
                Username: userSub
            })
            .promise();
        console.log(confirmResult);

        console.log(cognito);

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        ConfirmVerificationCode: defaultResolver(ConfirmVerificationCodeFunc)
    }
};
export default resolvers;
