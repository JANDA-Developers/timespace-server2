import { DocumentType } from "@typegoose/typegoose";
import { TransactionCls, TransactionModel } from "./Transaction";
import { ObjectId } from "mongodb";
import {
    TransactionHistoryItem,
    Paymethod,
    CurrencyCode,
    TrxHistoryItemStatus,
    NicepayRefundResultInput,
    NicepayPayResultInput
} from "../../types/graph";

export type CreateTransactionItemType = {
    sellerId: ObjectId;
    storeId: ObjectId;
    storeUserId: ObjectId;
    itemId: ObjectId;
    amount: number;
    paymethod: Paymethod;
};

export type TrxHistoryInput = {
    status: TrxHistoryItemStatus;
    amount: number;
    currency: CurrencyCode;
    payResult?: NicepayPayResultInput;
    paymethod: Paymethod;
    refundResult?: NicepayRefundResultInput;
};

export const findTransaction = async (
    id: ObjectId | string
): Promise<DocumentType<TransactionCls>> => {
    const result = await TransactionModel.findById(id);
    if (!result) {
        throw new Error("존재하지 않는 TransactionId");
    }
    return result;
};

// default => paymentStatus: PENDING, refundStatus: NONE
export const createTransaction = (
    input: CreateTransactionItemType
): DocumentType<TransactionCls> => {
    const transaction = new TransactionModel(input);
    setTransactionAmount(transaction, input.amount, {
        paid: 0,
        refunded: 0
    });
    setTransactionPayStatusToPending(transaction, {
        amount: input.amount,
        currency: "KRW",
        paymethod: input.paymethod
    });
    return transaction;
};

export const setTransactionPayStatusToPending = (
    transaction: DocumentType<TransactionCls>,
    input: {
        amount: number;
        currency: CurrencyCode;
        paymethod: Paymethod;
    }
): TransactionHistoryItem => {
    if (transaction.amountInfo.origin !== input.amount) {
        throw new Error("거래금액 불일치");
    }
    const item: TransactionHistoryItem = {
        type: "PAY",
        status: "PENDING",
        amount: input.amount,
        currency: input.currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null
    };
    transaction.paymentStatus = "PENDING";
    transaction.history.push(item);
    return item;
};

export const setTransactionPayStatusToDone = (
    transaction: DocumentType<TransactionCls>,
    {
        currency = "KRW",
        ...input
    }: {
        amount: number;
        currency?: CurrencyCode;
        paymethod: Paymethod;
        payResultInput: NicepayPayResultInput;
    }
): TransactionHistoryItem => {
    if (transaction.amountInfo.origin !== input.amount) {
        throw new Error("거래금액 불일치");
    }
    if (transaction.paymentStatus !== "PENDING") {
        throw new Error(
            `결제 대기중인 거래가 아닙니다. (결제상태: [${transaction.paymentStatus}])`
        );
    }
    const item: TransactionHistoryItem = {
        type: "PAY",
        status: "DONE",
        amount: input.amount,
        currency: currency,
        date: new Date(),
        payResult: input.payResultInput,
        paymethod: input.paymethod,
        refundResult: null
    };
    transaction.amountInfo.paid += input.amount;
    transaction.paymentStatus = "DONE";
    transaction.history.push(item);
    return item;
};

export const setTransactionPayStatusToCanceled = (
    transaction: DocumentType<TransactionCls>,
    {
        currency = "KRW",
        ...input
    }: {
        amount: number;
        currency?: CurrencyCode;
        paymethod: Paymethod;
    }
) => {
    if (transaction.amountInfo.origin !== input.amount) {
        throw new Error("거래금액 불일치");
    }
    if (transaction.paymentStatus === "DONE") {
        throw new Error(
            "이미 결제 완료된 거래입니다. 취소가 아닌 환불요청을 해주세요."
        );
    }
    if (transaction.paymentStatus === "CANCELED") {
        throw new Error("이미 취소된 거래입니다.");
    }
    const item: TransactionHistoryItem = {
        type: "PAY",
        status: "CANCELED",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null
    };
    transaction.paymentStatus = "DONE";
    transaction.history.push(item);
    return item;
};

export const setTransactionRefundStatusToPending = (
    transaction: DocumentType<TransactionCls>,
    {
        currency = "KRW",
        ...input
    }: {
        amount: number;
        currency?: CurrencyCode;
        paymethod: Paymethod;
    }
): TransactionHistoryItem => {
    const item: TransactionHistoryItem = {
        type: "REFUND",
        status: "PENDING",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null
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
export const setTransactionRefundStatusToDone = (
    transaction: DocumentType<TransactionCls>,
    {
        currency = "KRW",
        ...input
    }: {
        amount: number;
        currency?: CurrencyCode;
        paymethod: Paymethod;
    }
): TransactionHistoryItem => {
    // FIXME: 이게 있어야 하는지 고민좀 해봅시다... 20200716212000
    // if (transaction.amountInfo.paid < input.amount) {
    //     throw new Error("결제금액보다 환불금액이 더 많습니다.");
    // }
    const item: TransactionHistoryItem = {
        type: "REFUND",
        status: "DONE",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null
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
export const setTransactionRefundStatusToCancel = (
    transaction: DocumentType<TransactionCls>,
    {
        currency = "KRW",
        ...input
    }: {
        amount: number;
        currency?: CurrencyCode;
        paymethod: Paymethod;
    }
): TransactionHistoryItem => {
    if (transaction.amountInfo.refunded !== input.amount) {
        throw new Error("금액이 일치하지 않습니다.");
    }
    const item: TransactionHistoryItem = {
        type: "REFUND",
        status: "CANCELED",
        amount: input.amount,
        currency,
        date: new Date(),
        payResult: null,
        paymethod: input.paymethod,
        refundResult: null
    };
    transaction.refundStatus = "DONE";
    transaction.history.push(item);
    return item;
};

export const addRefundTrxHistoryItem = (
    transaction: DocumentType<TransactionCls>,
    input: TrxHistoryInput,
    nicepayInput?: {
        payResultInput?: NicepayPayResultInput;
        refundResultInput?: NicepayRefundResultInput;
    }
): TransactionHistoryItem => {
    const item: TransactionHistoryItem = {
        type: "REFUND",
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        date: new Date(),
        payResult: input.payResult || null,
        paymethod: input.paymethod,
        refundResult: input.refundResult || null
    };
    transaction.refundStatus = input.status;
    transaction.history.push(item);
    return item;
};

export const setTransactionAmount = (
    transaction: DocumentType<TransactionCls>,
    originAmount: number,
    amtInfo?: {
        refunded?: number;
        paid?: number;
    }
) => {
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
