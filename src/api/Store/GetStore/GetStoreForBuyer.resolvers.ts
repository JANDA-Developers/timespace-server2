import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetStoreForBuyerResponse,
    GetStoreForBuyerInput
} from "../../../types/graph";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";

const resolvers: Resolvers = {
    Query: {
        GetStoreForBuyer: defaultResolver(
            async ({ args: { param } }): Promise<GetStoreForBuyerResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const { storeCode } = param as GetStoreForBuyerInput;
                    const store = await StoreModel.findByCode(storeCode);
                    return {
                        ok: true,
                        error: null,
                        data: store as any
                    };
                } catch (error) {
                    return await errorReturn(error, session);
                }
            }
        )
    }
};
export default resolvers;
