import { SmsManagerFuncs } from "./SmsManager.interface";
import { ClientSession } from "mongoose";
import { SmsTriggerCls, SmsTriggerModel } from "../SmsTrigger/SmsTrigger";
import { SmsFormatCls, SmsFormatModel } from "../SmsFormat/SmsFormat";
import { Response } from "../../../utils/Response";
import { SmsSenderCls, SmsSenderModel } from "../SmsSender/SmsSender";
import { OffsetPageEdge } from "../../../utils/PaginationOffset";
import { ObjectId } from "mongodb";
import { SmsSentCls, SmsSentModel } from "../SmsSent/SmsSent";
import { sendSms, getSmsType } from "../../../utils/AligoFuncs";
import { ERROR_CODES } from "../../../types/values";
import { ApolloError } from "apollo-server";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { Err } from "../../../utils/Error";
import { SmsFormatAttribute } from "../../../types/graph";
import { mLogger } from "../../../logger";

export class SmsManager implements SmsManagerFuncs {
    constructor(key?: ObjectId | string) {
        this.key = new ObjectId(key);
    }

    validateFields(): Err[] {
        throw new Error("Method not implemented.");
    }

    private key: ObjectId;

    getKey() {
        return this.key;
    }

    async sendHistory(input: {
        sender: string;
    }): Promise<OffsetPageEdge<SmsSentCls>> {
        throw new Error("Method not implemented.");
    }

    async formatList(): Promise<OffsetPageEdge<SmsFormatCls>> {
        throw new Error("Method not implemented.");
    }

    async triggerList(
        page: {
            index: number;
            count: number;
        },
        filter: {
            event?: string;
            isEnable: boolean;
        }
    ): Promise<OffsetPageEdge<DocumentType<SmsTriggerCls>>> {
        const { index, count } = page;
        const search = {
            ...filter,
            key: this.key
        };
        const triggers = await SmsTriggerModel.find(search)
            .skip(index * count)
            .limit(count);
        const totalRowCount = await SmsTriggerModel.countDocuments(search);

        return {
            edgeInfo: {
                currentPageIndex: index,
                currentRowCount: triggers.length,
                totalPageCount: Math.floor(totalRowCount / count),
                totalRowCount
            },
            data: triggers
        };
    }

    async apply(session: ClientSession): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async send(input: {
        sender?: string;
        receivers: string[];
        message: string;
    }): Promise<
        Response<{
            ok: boolean;
            successCount: number;
            msgType: "SMS" | "LMS" | "MMS";
            errorCount: number;
        }>
    > {
        const session = await mongoose.startSession();
        session.startTransaction();
        const errors: any[] = [];
        try {
            const {
                resultCode,
                // msgType,
                successCnt: successCount,
                message: errMsg,
                msgType,
                errorCnt,
                msgId
            } = await sendSms({
                ...input,
                receivers: input.receivers.map(receiver =>
                    receiver.replace("+82", "")
                )
            });
            const ok = resultCode === "1";
            if (!ok) {
                errors.push(
                    new ApolloError(
                        "[Aligo] 문자 전송 실패",
                        ERROR_CODES.SMS_SEND_FAIL,
                        { errMsg }
                    )
                );
            }
            // smsSent 저장 ㄱ
            const smsHistory: DocumentType<SmsSentCls> = await this.saveHistory(
                {
                    ...input,
                    aligoMid: msgId,
                    successCount
                },
                session
            );
            console.log({
                smsHistory
            });
            await session.commitTransaction();
            session.endSession();
            return {
                ok: true,
                errors,
                data: {
                    ok,
                    errorCount: errorCnt,
                    msgType,
                    successCount
                }
            };
        } catch (error) {
            // 문자 전송이 실패해도 실패한 내역이 남아야함.
            await session.commitTransaction();
            session.endSession();
            return {
                ok: false,
                errors: [error],
                data: null
            };
        }
    }

    async sendWithTrigger(input: {
        event: string;
        formatAttributes: SmsFormatAttribute[];
        receivers: string[];
    }): Promise<Response<void>> {
        // TODO: Trigger 먼저 구하기
        // TODO: Send With Trigger!
        const { data: triggers } = await this.triggerList(
            {
                count: 10,
                index: 0
            },
            {
                isEnable: true,
                event: input.event
            }
        );

        const sendInput: {
            message: string;
            receivers: string[];
            sender?: string;
        }[] = await Promise.all(
            triggers.map(
                async (
                    trigger
                ): Promise<{
                    message: string;
                    receivers: string[];
                    sender?: string;
                }> => {
                    const format = await SmsFormatModel.findById(
                        trigger.formatId
                    );
                    mLogger.info(JSON.stringify({ format }));
                    if (format) {
                        const sender = await SmsSenderModel.findById(
                            trigger.senderId
                        );
                        const result = {
                            message: format.makeMessage(input.formatAttributes),
                            receivers: input.receivers,
                            sender: (sender && sender.phoneNumber) || undefined
                            // TODO: Sender 등록 필요
                        };
                        mLogger.info(JSON.stringify(result));
                        return result;
                    } else {
                        return {
                            message: "",
                            receivers: []
                        };
                    }
                }
            )
        );

        const result = await Promise.all(
            sendInput.map(async sinput => {
                return await this.send(sinput);
            })
        );
        console.log(result);
        mLogger.info(JSON.stringify(result));

        return {
            ok: true,
            errors: [
                {
                    code: "UNDERDEVELOPMENT",
                    message: "개발중"
                }
            ],
            data: undefined
        };
    }

    async senderAdd(
        sender: DocumentType<SmsSenderCls>,
        session: ClientSession
    ): Promise<Response<SmsSenderCls>> {
        try {
            await sender.save({ session });
        } catch (error) {
            return {
                ok: false,
                errors: [error],
                data: null
            };
        }
        throw new Error("Method not implemented.");
    }

    async senderRemove(
        phoneNumber: String,
        session: ClientSession
    ): Promise<Response<SmsSenderCls>> {
        throw new Error("Method not implemented.");
    }

    async formatAdd(
        SmsFormatCls: SmsFormatCls,
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    async formatRemove(
        SmsFormatCls: SmsFormatCls,
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    async formatsAdd(
        SmsFormatClss: SmsFormatCls[],
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    async formatsRemove(
        SmsFormatClss: SmsFormatCls[],
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    async triggerAdd(
        trigger: SmsTriggerCls,
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    async triggerRemove(
        trigger: SmsTriggerCls,
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    async triggersAdd(
        triggers: SmsTriggerCls[],
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    async triggersRemove(
        triggers: SmsTriggerCls[],
        session: ClientSession
    ): Promise<Response<void>> {
        throw new Error("Method not implemented.");
    }

    /*
     * ================================================================================================================================
     * 
     * 
     ! 여기부터는 private 함수들임 
     * 
     * 
     * ================================================================================================================================
     */

    private async saveHistory(
        input: {
            receivers: string[];
            message: string;
            aligoMid: string;
            sender?: string;
            successCount: number;
            format?: ObjectId;
        },
        session: ClientSession
    ) {
        // smsSent 저장 ㄱ
        const history: DocumentType<SmsSentCls> = await new SmsSentModel({
            key: this.getKey(),
            ...input,
            receiver: input.receivers[0],
            senderNumber: input.sender,
            type: getSmsType(input.message),
            ok: true
        }).save({ session });

        return history;
    }
}
