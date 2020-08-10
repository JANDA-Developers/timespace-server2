import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetPaymentAuthInfoResponse,
    GetPaymentAuthInfoQueryArgs
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import crypto from "crypto";
import moment from "moment";
import { ONE_HOUR } from "../../../utils/dateFuncs";

export const GetPaymentAuthInfoFunc = async ({
    args,
    context: { req }
}): Promise<GetPaymentAuthInfoResponse> => {
    try {
        const { amount } = args as GetPaymentAuthInfoQueryArgs;

        const time = moment(new Date(Date.now() + ONE_HOUR * 9)).format(
            "YYYYMMDDHHmmss"
        );
        const merchantId = process.env.NICEPAYMENT_MERCHANT_ID || "";
        const merchantKey = process.env.NICEPAYMENT_MERCHANT_KEY || "";
        const hash = crypto
            .createHash("sha256")
            .update(`${time}${merchantId}${amount}${merchantKey}`)
            .digest("hex");
        return {
            ok: true,
            error: null,
            data: {
                mid: merchantId,
                hash,
                date: time
            }
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetPaymentAuthInfo: defaultResolver(GetPaymentAuthInfoFunc)
    }
};
export default resolvers;
