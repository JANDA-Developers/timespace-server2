import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CancelItemForStoreUserResponse,
    CancelItemForStoreUserMutationArgs,
    SmsTriggerEvent
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel, ItemCls } from "../../../models/Item/Item";
import { StoreUserCls } from "../../../models/StoreUser/StoreUser";
import { StoreModel } from "../../../models/Store/Store";
import { UserModel } from "../../../models/User";
import {
    getReplacementSetsForItem,
    SendSmsWithTriggerEvent
} from "../../../models/Item/ItemSmsFunctions";
import { ProductModel } from "../../../models/Product/Product";
import { TransactionModel } from "../../../models/Transaction/Transaction";
import {
    setTransactionRefundStatusToPending,
    setTransactionRefundStatusToDone,
    nicepayRefund,
    findTidFromTransaction
} from "../../../models/Transaction/transactionFuncs";
import { ClientSession } from "mongoose";
import moment from "moment";
import { ONE_HOUR } from "../../../utils/dateFuncs";

export const CancelItemForStoreUserFunc = async ({
    args,
    context: { req }
}): Promise<CancelItemForStoreUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser }: { storeUser: DocumentType<StoreUserCls> } = req;
        const {
            comment,
            itemCode
        } = args as CancelItemForStoreUserMutationArgs;

        const item = await ItemModel.findByCode(itemCode);
        if (!item.storeUserId.equals(storeUser._id)) {
            throw new ApolloError(
                "해당 Item에 대한 사용 권한이 없습니다.",
                ERROR_CODES.ACCESS_DENY_ITEM
            );
        }
        await item
            .applyStatus("CANCELED", {
                comment: comment || undefined
            })
            .save({ session });

        // 문자를 보내야 하는데... 문자를 보내려면 관리자의 smsKey를 알아야함. 이하 그 과정임.
        const product = await ProductModel.findById(item.productId);
        const store = product?.storeId
            ? await StoreModel.findById(product.storeId)
            : undefined;
        const user = await UserModel.findById(store?.userId);
        if (!user) {
            throw new ApolloError(
                "존재하지 않는 UserId",
                ERROR_CODES.UNEXIST_USER
            );
        }

        await sendSms(item, user.smsKey);

        await cancelTransaction(item, session);

        await item.save({ session });

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const sendSms = async (item: DocumentType<ItemCls>, smsKey?: string) => {
    if (smsKey && item.phoneNumber) {
        // Send for buyer
        const tags = [
            {
                key: "storeId",
                value: item.storeId.toHexString()
            }
        ];
        const event: SmsTriggerEvent = "ITEM_CANCELED";

        // SMS 전송
        await SendSmsWithTriggerEvent({
            smsKey,
            event,
            tags,
            recWithReplSets: [
                {
                    receivers: [item.phoneNumber],
                    replacementSets: await getReplacementSetsForItem(item)
                }
            ]
        });
    }
};

export const cancelTransaction = async (
    item: DocumentType<ItemCls>,
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

    // TODO: 예약 취소
    const result = await nicepayRefund({
        amount: transaction.amountInfo.paid || transaction.amountInfo.origin,
        ediDate: moment(new Date(Date.now() + ONE_HOUR * 9)).format(
            "YYYYMMDDHHmmss"
        ),
        message: "Canceled by StoreUser",
        moid: cardPayResult?.Moid || "",
        tid: cardPayResult?.TID || ""
    });

    console.log({
        result
    });

    // DB상의 트랜잭션 상태 변경
    setTransactionRefundStatusToPending(transaction, {
        amount: transaction.amountInfo.paid,
        paymethod: transaction.paymethod,
        currency: transaction.currency
    });

    if (
        transaction.paymethod === "CARD" ||
        transaction.paymethod === "BILLING"
    ) {
        setTransactionRefundStatusToDone(transaction, {
            amount: transaction.amountInfo.origin,
            paymethod: transaction.paymethod,
            currency: transaction.currency
        });
    }
    await transaction.save({ session });
};

const resolvers: Resolvers = {
    Mutation: {
        CancelItemForStoreUser: defaultResolver(
            privateResolverForStoreUser(CancelItemForStoreUserFunc)
        )
    }
};

export default resolvers;
