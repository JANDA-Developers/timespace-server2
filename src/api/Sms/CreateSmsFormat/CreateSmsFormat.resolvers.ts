import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CreateSmsFormatResponse,
    CreateSmsFormatInput,
    ReplacementSet
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ObjectId } from "mongodb";
import { Err } from "../../../utils/Error";
import { SmsFormatModel } from "../../../models/Sms/SmsFormat/SmsFormat";
import _ from "lodash";

export const CreateSmsFormatFunc = async (
    { args, context: { req } },
    stack: any[]
): Promise<CreateSmsFormatResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const key = new ObjectId(cognitoUser["custom:smsKey"]);

        const { param }: { param: CreateSmsFormatInput } = args;

        const [validateResult, errors] = validate(key, param);
        if (!validateResult) {
            stack.push({ errors });
            throw new ApolloError(
                "파라미터 에러",
                ERROR_CODES.INVALID_PARAMETERS,
                {
                    errors
                }
            );
        }
        const { name, content, replacementSets } = param;
        const smsFormat = new SmsFormatModel({
            key,
            name,
            content,
            replacementSets: _.uniq(replacementSets).map(
                (k): ReplacementSet => {
                    return {
                        key: k,
                        replacer: `%%${k}%%`
                    };
                }
            )
        });

        await smsFormat.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: smsFormat as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        CreateSmsFormat: defaultResolver(privateResolver(CreateSmsFormatFunc))
    }
};

const validate = (
    key: string | ObjectId,
    { content }: CreateSmsFormatInput
): [boolean, Err[]] => {
    let [result, errors]: [boolean, Err[]] = [true, []];
    if (!content) {
        result = false;
        errors.push({
            code: ERROR_CODES.INVALID_PARAMETERS,
            message: "내용이 존재하지 않습니다."
        });
    }
    return [result, errors];
};

export default resolvers;
