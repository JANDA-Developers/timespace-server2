import { ObjectId } from "mongodb";

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
