import { BaseSchema, createSchemaOptions } from "../../../abs/BaseSchema";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { ModelName, getCollectionName } from "../../__collectionNames";
import { SmsFormatProps, SmsFormatFuncs } from "./SmsFormat.interface";
import { ObjectId } from "mongodb";
import { ReplacementSet, SmsFormatAttribute } from "GraphType";
import { Err } from "../../../utils/Error";
import { ERROR_CODES } from "../../../types/values";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SMS_FORMAT)))
export class SmsFormatCls extends BaseSchema
    implements SmsFormatProps, SmsFormatFuncs {
    @prop()
    key: ObjectId;

    @prop()
    content: string;

    @prop()
    replacementSets: ReplacementSet[];

    validateReplacementSets(): {
        ok: boolean;
        errors: Err[];
    } {
        throw new Error("Method not implemented.");
    }

    addReplacementSets(replacementSets: ReplacementSet[]): ReplacementSet[] {
        throw new Error("Method not implemented.");
    }

    removeReplacementSets(replacementSets: ReplacementSet[]): ReplacementSet[] {
        throw new Error("Method not implemented.");
    }

    validateFields(this: SmsFormatCls): Err[] {
        const errors: Err[] = [];
        if (!this.key) {
            errors.push({
                code: ERROR_CODES.INVALID_VALUES,
                message: "Key is Missing"
            });
        }
        throw new Error("Method not implemented.");
    }

    makeMessage(attributes: SmsFormatAttribute): string {
        throw new Error("Method not implemented.");
    }
}

export const SmsFormatModel = getModelForClass(SmsFormatCls);
