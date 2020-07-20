import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    AddTransactionHistoryToItemResponse,
    AddTransactionHistoryToItemMutationArgs,
    AddTransactionHistoryInput
} from "GraphType";
import {
    defaultResolver,
    privateResolverForInternalExec
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemCls, ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";
import {
    TransactionCls,
    TransactionModel
} from "../../../models/Transaction/Transaction";
import {
    setTransactionPayStatusToDone as setTransactionPayToDone,
    setTransactionPayStatusToCanceled as setTransactionPayToCanceled,
    setTransactionRefundStatusToPending as setTransactionRefundToPending,
    setTransactionRefundStatusToDone as setTransactionRefundToDone
} from "../../../models/Transaction/transactionFuncs";

export const AddTransactionHistoryToItemFunc = async ({
    args,
    context: { req }
}): Promise<AddTransactionHistoryToItemResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            itemId,
            input
        } = args as AddTransactionHistoryToItemMutationArgs;
        const item = await getExistItem(itemId);

        const transaction = await getTransaction(item.transactionId);
        setTransactionStatus(transaction, input);

        await transaction.save({ session });
        // TODO: transaction history 추가.

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: transaction as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const getExistItem = async (itemId: string): Promise<DocumentType<ItemCls>> => {
    const item = await ItemModel.findById(itemId);
    if (!item) {
        throw new ApolloError("존재하지 않는 ItemId", ERROR_CODES.UNEXIST_ITEM);
    }
    return item;
};

const setTransactionStatus = (
    item: DocumentType<TransactionCls>,
    input: AddTransactionHistoryInput
): void => {
    const { type, status } = input;
    switch (type) {
        case "PAY":
            if (status === "DONE") {
                if (!input.nicepayPayResultInput) {
                    throw new Error("결제결과가 존재하지 않습니다. ");
                }
                setTransactionPayToDone(item, {
                    ...input,
                    currency: input.currency!!,
                    payResultInput: input.nicepayPayResultInput
                });
            } else if (status === "CANCELED") {
                setTransactionPayToCanceled(item, {
                    ...input,
                    currency: input.currency!!
                });
            }
            break;
        case "REFUND":
            if (status === "PENDING") {
                setTransactionRefundToPending(item, {
                    ...input,
                    currency: input.currency!!
                });
            } else if (status === "DONE") {
                setTransactionRefundToDone(item, {
                    ...input,
                    currency: input.currency!!
                });
            }
            break;
        default:
            throw new Error("TransactionHistoryItemTypeError");
    }
};

const getTransaction = async (
    id?: ObjectId
): Promise<DocumentType<TransactionCls>> => {
    const trx = await TransactionModel.findById(id);
    if (!trx) {
        throw new ApolloError("Transaction이 존재하지 않습니다");
    }
    return trx;
};

const resolvers: Resolvers = {
    Mutation: {
        AddTransactionHistoryToItem: defaultResolver(
            privateResolverForInternalExec(AddTransactionHistoryToItemFunc)
        )
    }
};
export default resolvers;
