import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { RefundItemResponse, RefundItemMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { findItem } from "../../../models/Item/ItemModelFunctions";
import { cancelTransaction } from "../shared/CancelItemTransaction";

export const RefundItemFunc = async ({ args }): Promise<RefundItemResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { itemId, refundInput } = args as RefundItemMutationArgs;
        const item = await findItem(itemId);
        await cancelTransaction(item, refundInput, session);
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
        RefundItem: defaultResolver(privateResolver(RefundItemFunc))
    }
};
export default resolvers;
