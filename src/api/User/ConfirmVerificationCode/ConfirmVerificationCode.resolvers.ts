import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ConfirmVerificationCodeResponse,
    ConfirmVerificationCodeInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { CognitoIdentityServiceProvider } from "aws-sdk";

export const ConfirmVerificationCodeFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ConfirmVerificationCodeResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { param }: { param: ConfirmVerificationCodeInput } = args;
        const { code } = param;

        console.log(JSON.stringify({ code }));
        const cognito = new CognitoIdentityServiceProvider();
        // TODO: Sms Code로 가입 인증 변경 코드 작성
        // 참고자료: https://m.blog.naver.com/oksk0302/220986019426

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
