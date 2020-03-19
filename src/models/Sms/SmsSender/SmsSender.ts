import { BaseSchema, createSchemaOptions } from "../../../abs/BaseSchema";
import { SmsSenderFuncs, SmsSenderProps } from "./SmsSender.interface";
import { ModelName, getCollectionName } from "../../__collectionNames";
import { modelOptions, prop, getModelForClass } from "@typegoose/typegoose";
import { Response } from "../../../utils/Response";
import { ObjectId } from "mongodb";
import { SmsSenderAuthInfo } from "GraphType";
import { Err } from "../../../utils/Error";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SMS_SENDER)))
export class SmsSenderCls extends BaseSchema
    implements SmsSenderFuncs, SmsSenderProps {
    validateFields(): Err[] {
        throw new Error("Method not implemented.");
    }
    submitDocumentaryEvidence(
        documentaryEvidence: string[]
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    @prop({
        set: (ids: (string | ObjectId)[]) =>
            ids.map((id: string | ObjectId) => new ObjectId(id)),
        get: (ids: (string | ObjectId)[]) =>
            ids.map((id: string | ObjectId) => new ObjectId(id))
    })
    keys: ObjectId[];

    @prop()
    name: string;

    @prop()
    phoneNumber: string;

    @prop()
    authInfo: SmsSenderAuthInfo;
}

export const SmsSenderModel = getModelForClass(SmsSenderCls);
