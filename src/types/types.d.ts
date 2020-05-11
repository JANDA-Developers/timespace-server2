import { ObjectId } from "mongodb";
import { SmsTemplateKeyForItemUpsert } from "./graph";

export type CustomFieldCls = {
    key: ObjectId;
    label: string;
    type: "STRING" | "LIST" | "FILE";
    list: Array<string>;
    placeHolder: string | null;
    default: string | null;
    fileUrl: string | null;
    isMandatory: boolean;
};

export type CustomFieldValueCls = {
    key: ObjectId;
    label: string;
    type: "STRING" | "LIST" | "FILE" | null;
    value: string;
};

export type Replacements = {
    [K in SmsTemplateKeyForItemUpsert]?: string;
};

export type ReplacementSets = {
    key: String;
    value: String;
};
