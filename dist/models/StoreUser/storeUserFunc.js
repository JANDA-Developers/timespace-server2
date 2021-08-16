"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneNumberVerification = exports.startStoreUserVerification = void 0;
const axios_1 = __importDefault(require("axios"));
exports.startStoreUserVerification = async (storeUser, target, session) => {
    switch (target) {
        case "PHONE": {
            // 인증문자 전송
            const code = Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, "0");
            storeUser.phoneVerificationCode = code;
            await storeUser.save({ session });
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
            // const options = {
            //     url : "http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com",///process.env.URL,
            //     method : "post",
            //     data : {
            //         query : query(storeUser.phoneNumber, `회원가입 인증코드는 [${code}] 입니다.`)  
            //     }
            // }
            // const {data} = await axios(options);
            await axios_1.default.post("http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com", ///process.env.URL,
            {
                query: query(storeUser.phoneNumber, `회원가입 인증코드는 [${code}] 입니다.`)
            });
            // await sendSMS({
            //     receivers: storeUser.phoneNumber,
            //     msg: `회원가입 인증코드는 [${code}] 입니다.`
            // });
            return code;
        }
        case "EMAIL": {
            // TODO: Email 인증 미완성. Email 전송 로직이 없음
            const code = Math.random()
                .toString(36)
                .substr(2)
                .slice(0, 7)
                .toUpperCase();
            // await sendSMS({
            //     receivers: storeUser.phoneNumber,
            //     msg: `회원가입 인증코드는 [${code}] 입니다.`
            // });
            return code;
        }
        default: {
            throw new Error("VerificationTarget 값 에러");
        }
    }
};
exports.phoneNumberVerification = () => { };
//# sourceMappingURL=storeUserFunc.js.map