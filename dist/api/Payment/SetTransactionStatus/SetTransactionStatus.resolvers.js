"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetTransactionStatusFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const transactionFuncs_1 = require("../../../models/Transaction/transactionFuncs");
exports.SetTransactionStatusFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { transactionId, input: { amount, paymethod, payResult } } = args;
        if (!payResult) {
            throw new Error("결제 결과 파라미터를 입력해주세요.");
        }
        const transaction = await transactionFuncs_1.findTransaction(transactionId);
        const result = transactionFuncs_1.setTransactionPayStatusToDone(transaction, {
            amount,
            paymethod,
            payResultInput: payResult
        });
        console.log({
            historyItem: result
        });
        await transaction.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        SetTransactionStatus: resolverFuncWrapper_1.defaultResolver(exports.SetTransactionStatusFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=SetTransactionStatus.resolvers.js.map