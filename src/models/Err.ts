import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ERR)))
export class ErrCls extends BaseSchema {
    @prop({ required: true })
    message: string;

    @prop({ required: true })
    code: string;

    toString(this: DocumentType<ErrCls>): string {
        return `[${this.code}] ${this.message}`;
    }
}

export const ErrModel = getModelForClass(ErrCls);
