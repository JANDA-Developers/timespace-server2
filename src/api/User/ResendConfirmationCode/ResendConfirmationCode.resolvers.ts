import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ResendConfirmationCodeResponse,
    ResendConfirmationCodeMutationArgs
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { CognitoIdentityServiceProvider } from "aws-sdk";

export const ResendConfirmationCodeFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ResendConfirmationCodeResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            username,
            clientId
        } = args as ResendConfirmationCodeMutationArgs;
        const cognito = new CognitoIdentityServiceProvider();

        // TODO: 문자 보내야됨!
        const result = await cognito
            .resendConfirmationCode({
                ClientId: clientId,
                Username: username
            })
            .promise();

        console.log({
            resendResult: result.CodeDeliveryDetails
        });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        ResendConfirmationCode: defaultResolver(ResendConfirmationCodeFunc)
    }
};
export default resolvers;
