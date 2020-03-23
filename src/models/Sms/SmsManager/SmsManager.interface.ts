import { ClientSession } from "mongoose";
import { Response } from "../../../utils/Response";
import { SmsFormatCls } from "../SmsFormat/SmsFormat";
import { SmsTriggerCls } from "../SmsTrigger/SmsTrigger";
import { OffsetPageEdge } from "../../../utils/PaginationOffset";
import { SmsSentCls } from "../SmsSent/SmsSent";
import { SmsSenderCls } from "../SmsSender/SmsSender";
import { DocumentType } from "@typegoose/typegoose";
import { BaseSchemaFunc } from "../../../abs/BaseFuncInterface.interface";
import { SmsFormatAttribute } from "../../../types/graph";

export type FormatAttribute = {
    key: string;
    replacer: string;
};

export interface SmsManagerFuncs extends BaseSchemaFunc {
    apply(session: ClientSession): Promise<void>;
    send(input: {
        sender?: string;
        receivers: string[];
        message: string;
    }): Promise<
        Response<{
            ok: boolean;
            successCount: number;
            msgType: "SMS" | "LMS" | "MMS";
            errorCount: number;
        } | null>
    >;

    sendWithTrigger(input: {
        event: string;
        formatAttributes: SmsFormatAttribute[];
        receivers: string[];
    }): Promise<Response>;

    senderAdd(
        sender: DocumentType<SmsSenderCls>,
        session: ClientSession
    ): Promise<Response<SmsSenderCls>>;

    senderRemove(
        phoneNumber: String,
        session: ClientSession
    ): Promise<Response<SmsSenderCls>>;

    formatAdd(
        SmsFormatCls: SmsFormatCls,
        session: ClientSession
    ): Promise<Response>;

    formatRemove(
        SmsFormatCls: SmsFormatCls,
        session: ClientSession
    ): Promise<Response>;

    formatsAdd(
        SmsFormatClss: SmsFormatCls[],
        session: ClientSession
    ): Promise<Response>;

    formatsRemove(
        SmsFormatClss: SmsFormatCls[],
        session: ClientSession
    ): Promise<Response>;

    triggerAdd(
        trigger: SmsTriggerCls,
        session: ClientSession
    ): Promise<Response>;

    triggerRemove(
        trigger: SmsTriggerCls,
        session: ClientSession
    ): Promise<Response>;

    triggersAdd(
        triggers: SmsTriggerCls[],
        session: ClientSession
    ): Promise<Response>;

    triggersRemove(
        triggers: SmsTriggerCls[],
        session: ClientSession
    ): Promise<Response>;

    sendHistory(input: { sender: string }): Promise<OffsetPageEdge<SmsSentCls>>;

    formatList(): Promise<OffsetPageEdge<SmsFormatCls>>;
    triggerList(
        page: {
            // 0부터 시작
            index: number;
            // 몇줄?
            count: number;
        },
        filter: {
            event?: string;
            isEnable: boolean;
        }
    ): Promise<OffsetPageEdge<DocumentType<SmsTriggerCls>>>;
}
