import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    SetTransactionStatusResponse,
    SetTransactionStatusMutationArgs
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import {
    findTransaction,
    setTransactionPayStatusToDone
} from "../../../models/Transaction/transactionFuncs";

export const SetTransactionStatusFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<SetTransactionStatusResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            transactionId,
            input: { amount, paymethod, payResult }
        } = args as SetTransactionStatusMutationArgs;
        if (!payResult) {
            throw new Error("결제 결과 파라미터를 입력해주세요.");
        }
        const transaction = await findTransaction(transactionId);
        const result = setTransactionPayStatusToDone(transaction, {
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
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        SetTransactionStatus: defaultResolver(SetTransactionStatusFunc)
    }
};
export default resolvers;
