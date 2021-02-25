"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
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
const main = async () => {
    await axios_1.default.post("http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com", ///process.env.URL,
    {
        query: query("01063484556", `회원가입 인증코드는 [${1111111111}] 입니다.`)
    });
};
main();
//# sourceMappingURL=1_test.js.map