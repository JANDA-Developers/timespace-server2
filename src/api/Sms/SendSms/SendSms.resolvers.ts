import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { SendSmsResponse, SendSmsInput, SendSmsMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { SmsManager } from "../../../models/Sms/SmsManager/SmsManager";

export const SendSmsFunc = async (
    {
        args,
        context: { req }
    }: {
        args: SendSmsMutationArgs;
        context: any;
    },
    stack: any[]
): Promise<SendSmsResponse> => {
    try {
        const { cognitoUser } = req;
        const { param }: { param: SendSmsInput } = args;
        const key = cognitoUser["custom:smsKey"];
        const manager = new SmsManager(key);
        const { data, errors, ok } = await manager.send({
            ...param,
            sender: param.sender || undefined
        });

        stack.push({ errors });

        return {
            ok,
            error:
                (errors.length && {
                    code: "SMS_ERRORS",
                    msg: `${errors}`,
                    origin: errors
                }) ||
                null,
            data
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        SendSms: defaultResolver(privateResolver(SendSmsFunc))
    }
};
export default resolvers;
