import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetPaymentAuthInfoResponse,
    GetPaymentAuthInfoQueryArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import crypto from "crypto";
import moment from "moment";

export const GetPaymentAuthInfoFunc = async ({
    args,
    context: { req }
}): Promise<GetPaymentAuthInfoResponse> => {
    try {
        const { amount } = args as GetPaymentAuthInfoQueryArgs;

        const date = new Date();
        const time = moment(date).format("YYYYMMDDHHmmss");
        const merchantId = process.env.NICEPAYMENT_MERCHANT_ID || "";
        const merchantKey = process.env.NICEPAYMENT_MERCHANT_KEY || "";
        const mid = process.env.NICEPAYMENT_MID || "";
        const hash = crypto
            .createHash("sha256")
            .update(`${time}${merchantId}${amount}${merchantKey}`)
            .digest("hex");

        return {
            ok: true,
            error: null,
            data: {
                mid,
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
        GetPaymentAuthInfo: defaultResolver(
            privateResolver(GetPaymentAuthInfoFunc)
        )
    }
};
export default resolvers;
