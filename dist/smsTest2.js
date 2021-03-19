"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const main = async () => {
    let receivers = "01063484556";
    let msg = "문자테스트입니다!!!!!";
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
    const { data } = await axios_1.default.post("http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com/", {
        query: query(receivers, msg)
    });
    console.log(data);
};
main();
//# sourceMappingURL=smsTest2.js.map