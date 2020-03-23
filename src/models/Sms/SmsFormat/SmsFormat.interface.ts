import { ReplacementSet, SmsFormatAttribute } from "GraphType";
import { ObjectId } from "mongodb";
import { Err } from "../../../utils/Error";
import { BaseSchemaFunc } from "../../../abs/BaseFuncInterface.interface";

export interface SmsFormatProps {
    key: ObjectId;
    name: string;
    content: string;
    replacementSets: ReplacementSet[];
}

export interface SmsFormatFuncs extends BaseSchemaFunc {
    validateReplacementSets(): { ok: boolean; errors: Err[] };
    addReplacementSets(replacementSets: ReplacementSet[]): ReplacementSet[];
    removeReplacementSets(replacementSets: ReplacementSet[]): ReplacementSet[];
    makeMessage(attributes: SmsFormatAttribute[]): string;
}
