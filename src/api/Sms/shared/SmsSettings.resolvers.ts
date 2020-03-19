import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { SmsSettingsCls } from "../../../models/Sms/SmsSettings/SmsSettings";
import { SmsSenderModel } from "../../../models/Sms/SmsSender/SmsSender";

const resolvers: Resolvers = {
    SmsSettings: {
        senders: async (smsSettings: DocumentType<SmsSettingsCls>) => {
            return await SmsSenderModel.find({
                _id: { $in: smsSettings.senderIds }
            });
        }
    },
    SmsChargeOption: {
        __resolveType: (payOption: any): string => {
            switch (payOption.type) {
                case "PREPAY":
                    return "SmsPrepayOption";
                default:
                    return "SmsPostpayOption";
            }
        }
    },
    SmsChargeOptionInterface: {
        __resolveType: (payOption: any): string => {
            switch (payOption.type) {
                case "PREPAY":
                    return "SmsPrepayOption";
                default:
                    return "SmsPostpayOption";
            }
        }
    }
};

export default resolvers;
