import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetStoreByCodeResponse,
    GetStoreByCodeInput
} from "../../../types/graph";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";

const resolvers: Resolvers = {
    Query: {
        GetStoreByCode: defaultResolver(
            async ({ args: { param } }): Promise<GetStoreByCodeResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const { storeCode } = param as GetStoreByCodeInput;
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
