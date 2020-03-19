import { BaseSchema, createSchemaOptions } from "../../../abs/BaseSchema";
import {
    getModelForClass,
    modelOptions,
    prop,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../../__collectionNames";
import {
    SmsSentProps,
    SmsSentFuncs,
    AligoDetailResponse
} from "./SmsSent.interface";
import { ObjectId } from "mongodb";
import { SmsType } from "GraphType";
import { SmsFormatCls, SmsFormatModel } from "../SmsFormat/SmsFormat";
import { Response } from "../../../utils/Response";
import { Err } from "../../../utils/Error";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SMS_SENT)))
export class SmsSentCls extends BaseSchema
    implements SmsSentProps, SmsSentFuncs {
    validateFields(): Err[] {
        throw new Error("Method not implemented.");
    }
    @prop()
    receiver: string;

    @prop()
    aligoMid: string;

    @prop({
        default: () => new ObjectId(),
        get: (id: string | ObjectId) => new ObjectId(id),
        set: (id: string | ObjectId) => new ObjectId(id)
    })
    key: ObjectId;

    @prop()
    ok: boolean;

    @prop({
        default: () => new ObjectId(),
        get: (id: string | ObjectId) => new ObjectId(id),
        set: (id: string | ObjectId) => new ObjectId(id)
    })
    formatId?: ObjectId;

    @prop()
    type: SmsType;

    @prop()
    message: string;

    @prop()
    successCount: number;

    @prop({
        default(this: DocumentType<SmsSentCls>) {
            let paid = 20;
            if (this.type === "SMS") {
                paid = 20;
            } else if (this.type === "LMS") {
                paid = 35;
            } else {
                paid = 90;
            }
            return paid * this.successCount;
        }
    })
    cost: number;

    @prop()
    senderNumber: string;

    async getSmsFormat(): Promise<DocumentType<SmsFormatCls> | null> {
        return await SmsFormatModel.findById(this.formatId);
    }

    async getReceives(): Promise<Response<AligoDetailResponse>> {
        throw new Error("Method not implemented.");
    }
}

export const SmsSentModel = getModelForClass(SmsSentCls);
