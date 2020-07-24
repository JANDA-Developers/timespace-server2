import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ConfirmItemPaymentResponse,
    ConfirmItemPaymentMutationArgs
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { findItem } from "../../../models/Item/ItemModelFunctions";
import {
    findTransaction,
    setTransactionPayStatusToDone
} from "../../../models/Transaction/transactionFuncs";

export const ConfirmItemPaymentFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ConfirmItemPaymentResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            itemId,
            input: { amount, currency, payResult, paymethod }
        } = args as ConfirmItemPaymentMutationArgs;
        const item = await findItem(itemId);
        if (!item.transactionId) {
            throw new Error("결제대상 Item이 아닙니다.");
        }
        const transaction = await findTransaction(item.transactionId);

        if (!payResult) {
            throw new Error("결제 결과 input 누락");
        }

        const result = setTransactionPayStatusToDone(transaction, {
            amount,
            paymethod,
            currency: currency!!,
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
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        ConfirmItemPayment: defaultResolver(ConfirmItemPaymentFunc)
    }
};
export default resolvers;
