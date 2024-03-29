"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = void 0;
/* eslint-disable @typescript-eslint/camelcase */
const axios_1 = __importDefault(require("axios"));
exports.sendSMS = async ({ receivers, msg, sender = process.env.SMS_SENDER || "18334157" }) => {
    console.log(sender);
    // const host = `${process.env.API_URL}${process.env.API_EDGE_SMS}`;
    // const requestWithAxios = await axios.post(
    //     host + "/send/",
    //     {
    //         receivers: receivers.split(","),
    //         msg,
    //         sender
    //     },
    //     {
    //         headers: {
    //             "Content-Type": "application/json"
    //         }
    //     }
    // );
    // const {
    //     result_code,
    //     message,
    //     msg_id,
    //     success_cnt,
    //     error_cnt,
    //     msg_type
    // } = requestWithAxios.data;
    // const result = {
    //     errorCnt: error_cnt,
    //     msgType: msg_type || "SMS",
    //     message,
    //     msgId: msg_id,
    //     resultCode: result_code,
    //     successCnt: success_cnt
    // };
    // const ok = result_code === "1";
    // return {
    //     ok,
    //     error: ok ? null : result_code,
    //     result
    // };
    const query = (receivers, msg) => {
        return `mutation {
            SendSMS(
                receivers : "${receivers}"
                msg : "${msg}"
            )
            {
                ok
            }
        }
        `;
    };
    const { data } = await axios_1.default.post(process.env.SMS_API_EDGE
        ? process.env.SMS_API_EDGE
        : "http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com/", {
        query: query(receivers, msg)
    });
    //   const {data} = await axios.post(
    //     process.env.SMS_API_EDGE? process.env.SMS_API_EDGE :  "http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com/",
    //     {
    //         query : SendSMSQuery(receivers, msg)
    //     }
    //   )
    return data;
};
//# sourceMappingURL=smsFunction.js.map