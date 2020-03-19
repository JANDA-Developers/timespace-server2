import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { SendSmsResponse, SendSmsInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { SmsManager } from "../../../models/Sms/SmsManager/SmsManager";

export const SendSmsFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<SendSmsResponse> => {
    try {
        const { cognitoUser } = req;
        const { param }: { param: SendSmsInput } = args;
        const key = cognitoUser["custom:smsKey"];
        const manager = new SmsManager(key);
        const { data } = await manager.send(param);

        return {
            ok: true,
            error: null,
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
