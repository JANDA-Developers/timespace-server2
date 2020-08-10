import { ObjectId } from "mongodb";
import { DocumentType } from "@typegoose/typegoose";
import { VerificationCls, VerificationModel } from "./Verification";
import { VerificationTarget } from "../../types/graph";
import { ClientSession } from "mongoose";
import { sendSMS } from "../../utils/smsFunction";

export const findVerification = async (
    id: ObjectId | string
): Promise<DocumentType<VerificationCls>> => {
    const item = await VerificationModel.findById(id);
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
export const startVerification = async (
    target: VerificationTarget,
    payload: any,
    storeGroupCode?: string,
    session?: ClientSession
): Promise<DocumentType<VerificationCls>> => {
    let code: string;
    switch (target) {
        case "PHONE": {
            // 인증문자 전송
            const temp = Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, "0");
            code = temp;
            await sendSMS({
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
    const verification = new VerificationModel({
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
export const completeVerification = async (
    verificationInfo: {
        target: VerificationTarget;
        payload: any;
        storeGroupCode?: string;
        code: string;
    },
    session?: ClientSession
): Promise<DocumentType<VerificationCls> | undefined> => {
    const verification = await VerificationModel.findOne({
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
