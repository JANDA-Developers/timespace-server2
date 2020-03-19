import { ObjectId } from "mongodb";
import { SmsType, SmsReceived } from "GraphType";
import { DocumentType } from "@typegoose/typegoose";
import { SmsFormatCls } from "../SmsFormat/SmsFormat";
import { Response } from "../../../utils/Response";
import { BaseSchemaFunc } from "../../../abs/BaseFuncInterface.interface";

export type AligoDetailResponse = {
    ok: boolean;
    message: string;
    list: SmsReceived[];
    hasNext: boolean;
};

export interface SmsSentProps {
    key: ObjectId;
    ok: boolean;
    aligoMid: string;
    formatId?: ObjectId;
    type: SmsType;
    cost: number;
    // 보낸 메시지의 첫번째 배열 요소
    message: string;
    senderNumber: string;
    successCount: number;
    receiver: string;
}

export interface SmsSentFuncs extends BaseSchemaFunc {
    getSmsFormat(): Promise<DocumentType<SmsFormatCls> | null>;
    getReceives(
        page: number,
        pageSize: number
    ): Promise<Response<AligoDetailResponse>>;
}
