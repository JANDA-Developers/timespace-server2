import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { RegisterSenderResponse, RegisterSenderInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { SmsSenderModel } from "../../../models/Sms/SmsSender/SmsSender";
import { ObjectId } from "mongodb";

export const RegisterSenderFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<RegisterSenderResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { param }: { param: RegisterSenderInput } = args;
        const smsKey = new ObjectId(cognitoUser["custom:smsKey"]);
        const existingSender = await SmsSenderModel.findOne({
            keys: {
                $in: smsKey
            }
        });
        if (existingSender) {
            throw new ApolloError(
                "이미 발신자로 등록된 번호입니다.",
                ERROR_CODES.ALREADY_REGISTERED_SENDER
            );
        }
        const sender = new SmsSenderModel({
            ...param,
            keys: [smsKey]
        });
        await sender.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: sender as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        RegisterSender: defaultResolver(privateResolver(RegisterSenderFunc))
    }
};
export default resolvers;
