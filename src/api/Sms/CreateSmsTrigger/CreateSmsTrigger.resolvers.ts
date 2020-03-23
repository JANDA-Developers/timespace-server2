import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateSmsTriggerResponse, CreateSmsTriggerInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { Err } from "../../../utils/Error";
import { SmsSenderModel } from "../../../models/Sms/SmsSender/SmsSender";
import { ObjectId } from "mongodb";
import { SmsFormatModel } from "../../../models/Sms/SmsFormat/SmsFormat";
import { SmsTriggerModel } from "../../../models/Sms/SmsTrigger/SmsTrigger";

export const CreateSmsTriggerFunc = async (
    { args, context: { req } },
    stack: any[]
): Promise<CreateSmsTriggerResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const key = new ObjectId(cognitoUser["custom:smsKey"]);
        const { param }: { param: CreateSmsTriggerInput } = args;
        const [validateResult, errors] = await validateParams(key, param);
        if (!validateResult) {
            stack.push({ errors });
            throw new ApolloError(
                "Invalid parameters",
                ERROR_CODES.INVALID_PARAMETERS,
                {
                    errors
                }
            );
        }
        const { event, isEnable, senderId, smsFormat, sendTarget } = param;
        const senderObjectId = senderId ? new ObjectId(senderId) : undefined;
        if (!smsFormat || !event) {
            throw new ApolloError(
                "Validation 실패(서버에러) => undefined smsFormat",
                "VALIDATION_FAIL",
                {
                    smsFormat,
                    event
                }
            );
        }
        const formatId = new ObjectId(smsFormat);
        const smsTrigger = new SmsTriggerModel({
            key,
            senderId: senderObjectId,
            event,
            isEnable: isEnable ? true : false,
            formatId,
            sendTarget
        });
        await smsTrigger.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: smsTrigger as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        CreateSmsTrigger: defaultResolver(privateResolver(CreateSmsTriggerFunc))
    }
};

export default resolvers;

const validateParams = async (
    key: string | ObjectId,
    param: CreateSmsTriggerInput
): Promise<[boolean, Err[]]> => {
    // TODO: Validate params
    // 뭘 검증해야되니?
    // * 1. senderId가 존재한다면 sender의 존재여부, sender.keys에 나의 smsKey가 포함되어 있는지 확인
    // * 2. smsFormat이 반드시 존재해야함.
    // * 3. event가 반드시 존재햐야함. => 영어, "_"만 사용 가능
    let validateResult = true;
    const errors: Err[] = [];
    const senderId = param.senderId;
    if (!key) {
        throw new ApolloError(
            "SmsKey가 입력되지 않았습니다.",
            ERROR_CODES.INVALID_PARAMETERS
        );
    }
    const sender = await SmsSenderModel.findById(senderId);
    if (!sender) {
        if (senderId) {
            validateResult = false;
            errors.push({
                code: ERROR_CODES.INVALID_PARAMETERS,
                message: "존재하지 않는 SmsSenderId 입니다."
            });
        }
    } else {
        const haveAuthForSender = sender.keys.find(key => key.equals(key));
        if (!haveAuthForSender) {
            validateResult = false;

            errors.push({
                code: ERROR_CODES.UNAUTHORIZED_USER,
                message: "발신번호 사용권한이 없습니다."
            });
        }
    }

    const formatId = param.smsFormat;
    if (!formatId) {
        validateResult = false;
        errors.push({
            code: ERROR_CODES.INVALID_PARAMETERS,
            message: "FormatId가 입력되지 않았습니다."
        });
    } else {
        const [
            formatValidateResult,
            formatValidateErr
        ] = await validateSmsFormat(key, formatId);
        if (!formatValidateResult && formatValidateErr) {
            validateResult = false;
            errors.push(formatValidateErr);
        }
    }
    if (!param.event) {
        validateResult = false;
        errors.push({
            code: ERROR_CODES.INVALID_PARAMETERS,
            message: "event가 입력되지 않았습니다."
        });
    }

    return [validateResult, errors];
};

const validateSmsFormat = async (
    key: string | ObjectId,
    smsFormatId: string | ObjectId
): Promise<[boolean, Err?]> => {
    const smsFormat = await SmsFormatModel.findById(smsFormatId);
    if (!smsFormat) {
        return [
            false,
            {
                code: ERROR_CODES.INVALID_PARAMETERS,
                message: "존재하지 않는 SmsFormatId입니다."
            }
        ];
    }
    if (!smsFormat.key.equals(key)) {
        return [
            false,
            {
                code: ERROR_CODES.UNAUTHORIZED_USER,
                message: "SmsFormat에 대한 사용권한이 없습니다."
            }
        ];
    }
    return [true];
};
