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
    static makeErr(code: string, msg: string): Error {
        return new Error(JSON.stringify({ code, msg }));
    }

    @prop({ required: true })
    msg: string;

    @prop({ required: true })
    code: string;

    toString(this: DocumentType<ErrCls>): string {
        return `[${this.code}] ${this.msg}`;
    }

    toJsonString(this: DocumentType<ErrCls>): string {
        return JSON.stringify({ msg: this.msg, code: this.code });
    }
}

export const ErrModel = getModelForClass(ErrCls);
