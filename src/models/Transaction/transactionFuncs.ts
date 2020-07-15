import { DocumentType } from "@typegoose/typegoose";
import { TransactionCls, TransactionModel } from "./Transaction";
import { ObjectId } from "mongodb";
import {
    TransactionHistoryItem,
    Paymethod,
    CurrencyCode
} from "../../types/graph";

export type CreateTransactionItemType = {
    sellerId: ObjectId;
    storeId: ObjectId;
    storeUserId: ObjectId;
    productInfo: {
        target: string;
        payload: ObjectId;
    };
    amount: number;
    paymethod: Paymethod;
};

// default => paymentStatus: PENDING, refundStatus: NONE
export const createTransaction = (
    input: CreateTransactionItemType
): DocumentType<TransactionCls> => {
    const transaction = new TransactionModel(input);
    return transaction;
};

export const addPayTrxHistoryItem = (
    transaction: DocumentType<TransactionCls>,
    input: {
        amount: number;
        currency: CurrencyCode;
    }
): TransactionHistoryItem => {
    const item: TransactionHistoryItem = {
        type: "PAY",
        status: "DONE",
        amount: input.amount,
        currency: "KRW",
        date: new Date()
    };
    transaction.history.push(item);
    return item;
};

export const addRefundTrxHistoryItem = (
    transaction: DocumentType<TransactionCls>,
    input: {
        amount: number;
        currency: CurrencyCode;
    }
): TransactionHistoryItem => {
    const item: TransactionHistoryItem = {
        type: "PAY",
        amount: input.amount,
        currency: "KRW",
        date: new Date(),
        paymentStatus: "DONE",
        refundStatus: "NONE"
    };
    transaction.history.push(item);
    return item;
};
