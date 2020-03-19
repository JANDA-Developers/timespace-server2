import { Resolvers } from "../../../types/resolvers";
import { SmsFormatModel } from "../../../models/Sms/SmsFormat/SmsFormat";
import { DocumentType } from "@typegoose/typegoose";
import { SmsTriggerCls } from "../../../models/Sms/SmsTrigger/SmsTrigger";
import { SmsSenderModel } from "../../../models/Sms/SmsSender/SmsSender";

const resolvers: Resolvers = {
    SmsTrigger: {
        format: async (trigger: DocumentType<SmsTriggerCls>) => {
            return await SmsFormatModel.findById(trigger.formatId);
        },
        sender: async (trigger: DocumentType<SmsTriggerCls>) => {
            return (await SmsSenderModel.findById(trigger.senderId)) || null;
        }
    }
};
export default resolvers;
