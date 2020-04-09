import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetStoreForBuyerResponse, GetStoreForBuyerInput } from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store/Store";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";

const resolvers: Resolvers = {
    Query: {
        GetStoreForBuyer: defaultResolver(
            async ({ args: { param } }): Promise<GetStoreForBuyerResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const { storeCode } = param as GetStoreForBuyerInput;
                    const store = await StoreModel.findByCode(storeCode);

                    if (store.expiresAt) {
                        throw new ApolloError(
                            "삭제된 상점입니다.",
                            ERROR_CODES.DELETED_STORE
                        );
                    }
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
