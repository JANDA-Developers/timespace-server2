import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ConfirmVerificationCodeResponse,
    ConfirmVerificationCodeInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";

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

        /**
         * ============================================================
         *
         * Your Code Here~!
         *
         * ============================================================
         */
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
