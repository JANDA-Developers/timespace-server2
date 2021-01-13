"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelTransaction = void 0;
const transactionFuncs_1 = require("../../../models/Transaction/transactionFuncs");
const Transaction_1 = require("../../../models/Transaction/Transaction");
const dateFuncs_1 = require("../../../utils/dateFuncs");
const moment_1 = __importDefault(require("moment"));
/**
 * Item.transaction 값이 존재하지 않는 경우 그냥 return함.
 * @param item
 * @param refundInfo
 * @param session
 */
exports.cancelTransaction = async (item, refundInfo, session) => {
    const trxId = item.transactionId;
    if (!trxId) {
        return;
    }
    const transaction = await Transaction_1.TransactionModel.findById(trxId);
    if (!transaction) {
        throw new Error("존재하지 않는 Transaction");
    }
    const cardPayResult = transactionFuncs_1.findTidFromTransaction(transaction);
    const refundAmount = (refundInfo === null || refundInfo === void 0 ? void 0 : refundInfo.amount) ||
        transaction.amountInfo.paid ||
        transaction.amountInfo.origin;
    const result = await transactionFuncs_1.nicepayRefund({
        amount: refundAmount,
        ediDate: moment_1.default(new Date(Date.now() + dateFuncs_1.ONE_HOUR * 9)).format("YYYYMMDDHHmmss"),
        originAmount: transaction.amountInfo.origin,
        message: "Canceled by StoreUser",
        moid: (cardPayResult === null || cardPayResult === void 0 ? void 0 : cardPayResult.Moid) || "",
        tid: (cardPayResult === null || cardPayResult === void 0 ? void 0 : cardPayResult.TID) || ""
    });
    console.log(result);
    if (transaction.refundStatus !== "PENDING") {
        // DB상의 트랜잭션 상태 변경
        transactionFuncs_1.setTransactionRefundStatusToPending(transaction, {
            amount: refundAmount,
            paymethod: transaction.paymethod,
            currency: transaction.currency,
            message: (refundInfo === null || refundInfo === void 0 ? void 0 : refundInfo.message) || undefined
        });
    }
    if (transaction.paymethod === "CARD" ||
        transaction.paymethod === "BILLING") {
        transactionFuncs_1.setTransactionRefundStatusToDone(transaction, {
            amount: refundAmount,
            paymethod: transaction.paymethod,
            currency: transaction.currency,
            message: (refundInfo === null || refundInfo === void 0 ? void 0 : refundInfo.message) || undefined
        });
    }
    await transaction.save({ session });
};
//# sourceMappingURL=CancelItemTransaction.js.map