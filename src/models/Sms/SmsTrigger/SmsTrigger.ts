import { BaseSchema, createSchemaOptions } from "../../../abs/BaseSchema";
import { SmsTriggerFuncs, SmsTriggerProps } from "./SmsTrigger.interface";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { getCollectionName, ModelName } from "../../__collectionNames";
import { Err } from "../../../utils/Error";
import { SmsSendTarget } from "../../../types/graph";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SMS_TRIGGER)))
export class SmsTriggerCls extends BaseSchema
    implements SmsTriggerFuncs, SmsTriggerProps {
    validateFields(): Err[] {
        throw new Error("Method not implemented.");
    }
    @prop({ required: true })
    key: ObjectId;

    @prop({ required: [true, "SmsFormat이 설정되지 않았습니다."] })
    formatId: ObjectId;

    @prop({})
    senderId?: ObjectId;

    @prop({ required: [true, "event 누락"] })
    event: string;

    @prop({ default: () => true })
    isEnable: boolean;

    @prop({})
    sendTarget: SmsSendTarget;
}

export const SmsTriggerModel = getModelForClass(SmsTriggerCls);
