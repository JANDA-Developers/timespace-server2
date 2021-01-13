"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTidFromTransaction = exports.nicepayRefund = exports.setTransactionAmount = exports.addRefundTrxHistoryItem = exports.setTransactionRefundStatusToCancel = exports.setTransactionRefundStatusToDone = exports.setTransactionRefundStatusToPending = exports.setTransactionPayStatusToCanceled = exports.setTransactionPayStatusToDone = exports.setTransactionPayStatusToPending = exports.createTransaction = exports.findTransaction = void 0;
const Transaction_1 = require("./Transaction");
const axios_1 = __importDefault(require("axios"));
/**
 * Find Transaction in Database. If nothing found, throw error and exit.
 * @param id transaction Id
 */
exports.findTransaction = async (id) => {
    const result = await Transaction_1.TransactionModel.findById(id);
    if (!result) {
        throw new Error("존재하지 않는 TransactionId");
    }
    return result;
};
// default => paymentStatus: PENDING, refundStatus: NONE
exports.createTransaction = (input) => {
    const transaction = new Transaction_1.TransactionModel(input);
    exports.setTransactionAmount(transaction, input.amount, {
        paid: 0,
        refunded: 0
    });
    exports.setTransactionPayStatusToPending(transaction, {
        amount: input.amount,
        currency: "KRW",
        paymethod: input.paymethod
    });
    return transaction;
};
exports.setTransactionPayStatusToPending = (transaction, input) => {
    if (transaction.amountInfo.origin !== input.amount) {
        throw new Error("거래금액 불일치");
    }
    const item = {
        type: "PAY",
        status: "PENDING",
        amount: input.amount,
        currency: input.currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null,
        message: input.message || null
    };
    transaction.paymentStatus = "PENDING";
    transaction.history.push(item);
    return item;
};
exports.setTransactionPayStatusToDone = (transaction, { currency = "KRW", ...input }) => {
    if (transaction.amountInfo.origin !== input.amount) {
        throw new Error("거래금액 불일치");
    }
    if (transaction.paymentStatus !== "PENDING") {
        throw new Error(`결제 대기중인 거래가 아닙니다. (결제상태: [${transaction.paymentStatus}])`);
    }
    const item = {
        type: "PAY",
        status: "DONE",
        amount: input.amount,
        currency: currency,
        date: new Date(),
        payResult: input.payResultInput,
        paymethod: input.paymethod,
        refundResult: null,
        message: input.message || null
    };
    transaction.amountInfo = {
        ...transaction.amountInfo,
        paid: transaction.amountInfo.paid + input.amount
    };
    transaction.paymentStatus = "DONE";
    transaction.history.push(item);
    return item;
};
exports.setTransactionPayStatusToCanceled = (transaction, { currency = "KRW", ...input }) => {
    if (transaction.amountInfo.origin !== input.amount) {
        throw new Error("거래금액 불일치");
    }
    if (transaction.paymentStatus === "DONE") {
        throw new Error("이미 결제 완료된 거래입니다. 취소가 아닌 환불요청을 해주세요.");
    }
    if (transaction.paymentStatus === "CANCELED") {
        throw new Error("이미 취소된 거래입니다.");
    }
    const item = {
        type: "PAY",
        status: "CANCELED",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null,
        message: input.message || null
    };
    transaction.paymentStatus = "DONE";
    transaction.history.push(item);
    return item;
};
exports.setTransactionRefundStatusToPending = (transaction, { currency = "KRW", ...input }) => {
    const item = {
        type: "REFUND",
        status: "PENDING",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null,
        message: input.message || null
    };
    transaction.refundStatus = "PENDING";
    transaction.history.push(item);
    return item;
};
/**
 * 음... 부분취소도 가능하게 해야할것 같고...?
 * @param transaction
 * @param param1
 */
exports.setTransactionRefundStatusToDone = (transaction, { currency = "KRW", ...input }) => {
    // FIXME: 이게 있어야 하는지 고민좀 해봅시다... 20200716212000
    // if (transaction.amountInfo.paid < input.amount) {
    //     throw new Error("결제금액보다 환불금액이 더 많습니다.");
    // }
    const item = {
        type: "REFUND",
        status: "DONE",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null,
        message: input.message || null
    };
    transaction.refundStatus = "DONE";
    transaction.history.push(item);
    return item;
};
/**
 * 환불신청을 취소했을때... 아직은 지원하지 않는 함수임!
 * @param transaction
 * @param param1
 */
exports.setTransactionRefundStatusToCancel = (transaction, { currency = "KRW", ...input }) => {
    if (transaction.amountInfo.refunded !== input.amount) {
        throw new Error("금액이 일치하지 않습니다.");
    }
    const item = {
        type: "REFUND",
        status: "CANCELED",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null,
        message: input.message || null
    };
    transaction.refundStatus = "DONE";
    transaction.history.push(item);
    return item;
};
exports.addRefundTrxHistoryItem = (transaction, input, nicepayInput) => {
    const item = {
        type: "REFUND",
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        date: new Date(),
        payResult: input.payResult || null,
        paymethod: input.paymethod,
        refundResult: input.refundResult || null,
        message: null
    };
    transaction.refundStatus = input.status;
    transaction.history.push(item);
    return item;
};
exports.setTransactionAmount = (transaction, originAmount, amtInfo) => {
    transaction.amountInfo.origin = originAmount;
    if (amtInfo) {
        if (amtInfo.refunded != null) {
            transaction.amountInfo.refunded = amtInfo.refunded;
        }
        if (amtInfo.paid != null) {
            transaction.amountInfo.paid = amtInfo.paid;
        }
    }
};
exports.nicepayRefund = async (input) => {
    console.log({
        cancelItemInput: input
    });
    const result = await axios_1.default.post(process.env.API_URL + "/payment/pay/cancel", {
        ...input,
        isPartialCancel: input.amount !== input.originAmount ? 1 : 0
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    });
    const { data, statusText, status } = result;
    if (status !== 200) {
        throw new Error(statusText);
    }
    console.log({
        data,
        status
    });
    return data;
};
exports.findTidFromTransaction = (trx) => {
    const history = trx.history;
    const item = history.filter(item => item.type === "PAY" && item.payResult)[0];
    return item === null || item === void 0 ? void 0 : item.payResult;
};
//# sourceMappingURL=transactionFuncs.js.map