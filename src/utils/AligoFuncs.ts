/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */
import axios from "axios";
import { SmsType } from "GraphType";
import { getByteLength } from "./utils";

type SmsSendResult = {
    errorCnt: number;
    msgType: "SMS" | "LMS" | "MMS";
    message: string;
    msgId: string;
    resultCode: string;
    successCnt: number;
};

type SmsDetailsResult = {
    ok: boolean;
    list: Array<{
        mdid: string;
        type: "SMS" | "LMS" | "MMS";
        sender: string;
        receiver: string;
    }>;
};

// axios Error 발생
export const sendSms = async ({
    receivers,
    message,
    sender = process.env.SMS_SENDER
}: {
    receivers: string[];
    message: string;
    sender?: string;
}): Promise<SmsSendResult> => {
    const host = `${process.env.API_URL}${process.env.API_EDGE_SMS}`;

    const requestWithAxios = await axios.post(
        host + "/send/",
        {
            receivers,
            sender,
            msg: message
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
    const {
        result_code,
        message: message2,
        msg_id,
        success_cnt,
        error_cnt,
        msg_type
    } = requestWithAxios.data;

    const result = {
        errorCnt: error_cnt,
        msgType: msg_type || "SMS",
        message: message2,
        msgId: msg_id,
        resultCode: result_code,
        successCnt: success_cnt
    };

    return result;
};

/**
 * 각각 다른 메시지들을 다른 사용자들에게 보내기 위한 메서드.
 * 순수하게 "보내기" 기능만 한다.
 * @param sender 발신자
 * @param recMsgs 발신할 문자정보
 * @param smsInfoId 발신자 sms설정값
 * @param testmodeYn 테스트모드
 */
export const sendSMSMass = async (input: {
    recMsgs: {
        receiver: string;
        message: string;
    }[];
    msgType: SmsType;
    sender?: string;
}): Promise<SmsSendResult> => {
    const { msgType, recMsgs, sender } = input;
    const host = `${process.env.API_URL}${process.env.API_EDGE_SMS}`;
    const cnt = recMsgs.length;

    const param = {
        sender: sender || process.env.ALIGO_SENDER_PHONE_NUMBER,
        cnt,
        recMsgs,
        msg_type: msgType
    };

    // sendParams => rec_1, msg_1, rec_2, msg_2..... 을 Key로 하는 object로 만들어야함.

    const requestWithAxios = await axios.post(host + "/send/mass", param, {
        headers: {
            "Content-Type": "application/json"
        }
    });
    const {
        result_code,
        message,
        msg_id,
        success_cnt,
        error_cnt,
        msg_type
    } = requestWithAxios.data;

    const result = {
        errorCnt: error_cnt,
        msgType: msg_type || null,
        message,
        msgId: msg_id,
        resultCode: result_code,
        successCnt: success_cnt
    };

    return result;
};

export const receivedDetails = async (
    aligoMid: string,
    aligoPageInfo: {
        pageSize: number;
        page: number;
    } = {
        pageSize: 30,
        page: 1
    }
): Promise<SmsDetailsResult> => {
    const host = `${process.env.API_URL}${process.env.API_EDGE_SMS}`;
    const requestWithAxios = await axios.post(
        host + "/details",
        {
            msgId: aligoMid,
            page: aligoPageInfo.page,
            pageSize: aligoPageInfo.pageSize
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
    const result: {
        resultCode: number;
        message: string;
        list: Array<{
            mdid: string;
            type: "SMS" | "LMS" | "MMS";
            sender: string;
            receiver: string;
            sms_state: string;
            send_date: string;
            reserve_date: string;
        }>;
    } = requestWithAxios.data;
    console.log({
        result
    });
    return {
        ok: result.resultCode === 1,
        list: result.list
    };
};

export const getSmsType = (message: string): SmsType => {
    const byte = getByteLength(message);
    if (byte <= 90) {
        return "SMS";
    } else if (byte > 90 && byte <= 2000) {
        return "LMS";
    } else {
        return "MMS";
    }
};

export const getCost = (type: SmsType) => {
    let paid = 20;
    if (type === "SMS") {
        paid = 20;
    } else if (type === "LMS") {
        paid = 35;
    } else {
        paid = 90;
    }
    return paid;
};

export const sendVerificationSMS = (
    receiver: string,
    key: string
): Promise<SmsSendResult> =>
    sendSms({
        receivers: [receiver],
        message: `Your Verificaion Key is: ${key}`
    });

export const sendYourEmailSMS = (
    receiver: string,
    email: string
): Promise<SmsSendResult> =>
    sendSms({
        receivers: [receiver],
        message:
            (email && `현재 가입되어있는 계정: ${email} `) ||
            "가입된 계정이 없습니다."
    });
