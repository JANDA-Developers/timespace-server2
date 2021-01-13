"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPaymentAuthInfoFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const crypto_1 = __importDefault(require("crypto"));
const moment_1 = __importDefault(require("moment"));
const dateFuncs_1 = require("../../../utils/dateFuncs");
exports.GetPaymentAuthInfoFunc = async ({ args, context: { req } }) => {
    try {
        const { amount } = args;
        const time = moment_1.default(new Date(Date.now() + dateFuncs_1.ONE_HOUR * 9)).format("YYYYMMDDHHmmss");
        const merchantId = process.env.NICEPAYMENT_MERCHANT_ID || "";
        const merchantKey = process.env.NICEPAYMENT_MERCHANT_KEY || "";
        const hash = crypto_1.default
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
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Query: {
        GetPaymentAuthInfo: resolverFuncWrapper_1.defaultResolver(exports.GetPaymentAuthInfoFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetPaymentAuthInfo.resolvers.js.map