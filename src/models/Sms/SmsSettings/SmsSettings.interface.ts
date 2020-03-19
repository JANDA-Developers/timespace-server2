import { SmsChargeOption } from "GraphType";
import { ObjectId } from "mongodb";
import { BaseSchemaFunc } from "../../../abs/BaseFuncInterface.interface";

export interface SmsSettingsProps {
    key: ObjectId;
    point: number;
    chargeOption: SmsChargeOption;
    senderIds: ObjectId[];
}

export interface SmsSettingsFuncs extends BaseSchemaFunc {}
