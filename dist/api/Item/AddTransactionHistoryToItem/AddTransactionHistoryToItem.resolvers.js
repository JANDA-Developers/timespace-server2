"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTransactionHistoryToItemFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const Transaction_1 = require("../../../models/Transaction/Transaction");
const transactionFuncs_1 = require("../../../models/Transaction/transactionFuncs");
exports.AddTransactionHistoryToItemFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { itemId, input } = args;
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
            data: transaction
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const getExistItem = async (itemId) => {
    const item = await Item_1.ItemModel.findById(itemId);
    if (!item) {
        throw new apollo_server_1.ApolloError("존재하지 않는 ItemId", values_1.ERROR_CODES.UNEXIST_ITEM);
    }
    return item;
};
const setTransactionStatus = (item, input) => {
    const { type, status } = input;
    switch (type) {
        case "PAY":
            if (status === "DONE") {
                if (!input.nicepayPayResultInput) {
                    throw new Error("결제결과가 존재하지 않습니다. ");
                }
                transactionFuncs_1.setTransactionPayStatusToDone(item, {
                    ...input,
                    currency: input.currency,
                    payResultInput: input.nicepayPayResultInput,
                    message: input.message || undefined
                });
            }
            else if (status === "CANCELED") {
                transactionFuncs_1.setTransactionPayStatusToCanceled(item, {
                    ...input,
                    currency: input.currency,
                    message: input.message || undefined
                });
            }
            break;
        case "REFUND":
            if (status === "PENDING") {
                transactionFuncs_1.setTransactionRefundStatusToPending(item, {
                    ...input,
                    currency: input.currency,
                    message: input.message || undefined
                });
            }
            else if (status === "DONE") {
                transactionFuncs_1.setTransactionRefundStatusToDone(item, {
                    ...input,
                    currency: input.currency,
                    message: input.message || undefined
                });
            }
            break;
        default:
            throw new Error("TransactionHistoryItemTypeError");
    }
};
const getTransaction = async (id) => {
    const trx = await Transaction_1.TransactionModel.findById(id);
    if (!trx) {
        throw new apollo_server_1.ApolloError("Transaction이 존재하지 않습니다");
    }
    return trx;
};
const resolvers = {
    Mutation: {
        AddTransactionHistoryToItem: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForInternalExec(exports.AddTransactionHistoryToItemFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=AddTransactionHistoryToItem.resolvers.js.map