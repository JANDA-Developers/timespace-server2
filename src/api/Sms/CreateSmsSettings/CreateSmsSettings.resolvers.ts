import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateSmsSettingsResponse, CreateSmsSettingsInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import {
    SmsSettingsModel,
    SmsSettingsCls
} from "../../../models/Sms/SmsSettings/SmsSettings";
import { ObjectId } from "mongodb";
import { UserModel } from "../../../models/User";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";

export const CreateSmsSettingsFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<CreateSmsSettingsResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { param }: { param: CreateSmsSettingsInput } = args;
        // TODO: 중복체크 해야된다
        const settings = getSmsSettingsCls(param);
        const user = await UserModel.findBySub(cognitoUser.sub);
        user.smsKey = settings.key;
        await user.updateUser([
            {
                Name: "custom:smsKey",
                Value: user.smsKey.toHexString()
            }
        ]);
        await user.save({ session });
        await settings.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: settings as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const getSmsSettingsCls = (
    param: CreateSmsSettingsInput
): DocumentType<SmsSettingsCls> => {
    const { chargeOption } = param;
    if (!chargeOption) {
        throw new ApolloError(
            "ChargeOption이 입력되지 않았습니다.",
            ERROR_CODES.INVALID_PARAMETERS
        );
    }
    const smsSettings = new SmsSettingsModel({
        key: new ObjectId(),
        chargeOption: {
            type: chargeOption.type,
            ...chargeOption.postpayOption,
            ...chargeOption.prepayOption
        }
    });

    return smsSettings;
};

const resolvers: Resolvers = {
    Mutation: {
        CreateSmsSettings: defaultResolver(
            privateResolver(CreateSmsSettingsFunc)
        )
    }
};
export default resolvers;
