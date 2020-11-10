import {
    setTransactionRefundStatusToPending,
    setTransactionRefundStatusToDone,
    nicepayRefund,
    findTidFromTransaction
} from "../../../models/Transaction/transactionFuncs";
import { TransactionModel } from "../../../models/Transaction/Transaction";
import { DocumentType } from "@typegoose/typegoose";
import { ClientSession } from "mongoose";
import { ItemCls } from "../../../models/Item/Item";
import { ONE_HOUR } from "../../../utils/dateFuncs";
import moment from "moment";
import { RefundInput } from "../../../types/graph";

/**
 * Item.transaction 값이 존재하지 않는 경우 그냥 return함.
 * @param item
 * @param refundInfo
 * @param session
 */
export const cancelTransaction = async (
    item: DocumentType<ItemCls>,
    refundInfo?: RefundInput,
    session?: ClientSession
) => {
    const trxId = item.transactionId;
    if (!trxId) {
        return;
    }

    const transaction = await TransactionModel.findById(trxId);
    if (!transaction) {
        throw new Error("존재하지 않는 Transaction");
    }

    const cardPayResult = findTidFromTransaction(transaction);

    const refundAmount =
        refundInfo?.amount ||
        transaction.amountInfo.paid ||
        transaction.amountInfo.origin;

    const result = await nicepayRefund({
        amount: refundAmount,
        ediDate: moment(new Date(Date.now() + ONE_HOUR * 9)).format(
            "YYYYMMDDHHmmss"
        ),
        originAmount: transaction.amountInfo.origin,
        message: "Canceled by StoreUser",
        moid: cardPayResult?.Moid || "",
        tid: cardPayResult?.TID || ""
    });

    console.log(result);

    if (transaction.refundStatus !== "PENDING") {
        // DB상의 트랜잭션 상태 변경
        setTransactionRefundStatusToPending(transaction, {
            amount: refundAmount,
            paymethod: transaction.paymethod,
            currency: transaction.currency,
            message: refundInfo?.message || undefined
        });
    }

    if (
        transaction.paymethod === "CARD" ||
        transaction.paymethod === "BILLING"
    ) {
        setTransactionRefundStatusToDone(transaction, {
            amount: refundAmount,
            paymethod: transaction.paymethod,
            currency: transaction.currency,
            message: refundInfo?.message || undefined
        });
    }
    await transaction.save({ session });
};
