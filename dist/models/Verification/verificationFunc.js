"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeVerification = exports.startVerification = exports.findVerification = void 0;
const Verification_1 = require("./Verification");
const smsFunction_1 = require("../../utils/smsFunction");
exports.findVerification = async (id) => {
    const item = await Verification_1.VerificationModel.findById(id);
    if (!item) {
        throw new Error("Verifiction Object is not exist!");
    }
    return item;
};
/**
 * 해당 함수는 verification.save를 포함함.
 * 전화번호 인증의 경우 따로 SMS전송까지 포함되어있음!
 * @param target 인증수단
 * @param payload 인증할 정보
 */
exports.startVerification = async (target, payload, storeGroupCode, session) => {
    let code;
    switch (target) {
        case "PHONE": {
            // 인증문자 전송
            const temp = Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, "0");
            code = temp;
            await smsFunction_1.sendSMS({
                receivers: payload,
                msg: `회원가입 인증코드는 [${code}] 입니다.`
            });
            break;
        }
        case "EMAIL": {
            // TODO: Email 인증 미완성. Email 전송 로직이 없음
            const temp = Math.random()
                .toString(36)
                .substr(2)
                .slice(0, 7)
                .toUpperCase();
            code = temp;
            break;
        }
        default: {
            throw new Error("VerificationTarget 값 에러");
        }
    }
    console.log({ code });
    const verification = new Verification_1.VerificationModel({
        target,
        payload,
        isVerified: false,
        storeGroupCode,
        code
    });
    await verification.save({ session });
    return verification;
};
/**
 * 해당 함수는 Save 액션을 유발함. 따라서... 조심해서 사용하긔
 * @param verification 인증 객체
 * @param code 인증 코드
 */
exports.completeVerification = async (verificationInfo, session) => {
    const verification = await Verification_1.VerificationModel.findOne({
        ...verificationInfo,
        isVerified: false
    });
    if (!verification) {
        return undefined;
    }
    verification.isVerified = true;
    await verification.save({ session });
    return verification;
};
//# sourceMappingURL=verificationFunc.js.map