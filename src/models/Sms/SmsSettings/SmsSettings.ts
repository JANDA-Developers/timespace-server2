import { BaseSchema, createSchemaOptions } from "../../../abs/BaseSchema";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../../__collectionNames";
import { SmsSettingsProps, SmsSettingsFuncs } from "./SmsSettings.interface";
import { ObjectId } from "mongodb";
import { SmsChargeOption } from "GraphType";
import { Err } from "../../../utils/Error";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SMS_SETTINGS)))
export class SmsSettingsCls extends BaseSchema
    implements SmsSettingsProps, SmsSettingsFuncs {
    validateFields(): Err[] {
        throw new Error("Method not implemented.");
    }
    @prop({
        set: (id: any) => new ObjectId(id),
        get: (id: any) => new ObjectId(id)
    })
    key: ObjectId;

    @prop({
        default: (): SmsChargeOption => {
            return {
                type: "POSTPAY",
                chargeDeadline: 5000,
                chargingUnit: 10000,
                chargingPeriod: 1,
                initDate: new Date()
            };
        }
    })
    chargeOption: SmsChargeOption;

    @prop({ default: 0 })
    point: number;

    @prop({
        default: [],
        set: (ids: (string | ObjectId)[]) => ids.map(id => new ObjectId(id)),
        get: (ids: (string | ObjectId)[]) => ids.map(id => new ObjectId(id))
    })
    senderIds: ObjectId[];

    validateParams() {
        throw new Error("Method not implemented.");
    }
}

export const SmsSettingsModel = getModelForClass(SmsSettingsCls);
