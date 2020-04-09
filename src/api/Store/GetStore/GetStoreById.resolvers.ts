import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetStoreByIdResponse, GetStoreByIdInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreModel } from "../../../models/Store/Store";

const resolvers: Resolvers = {
    Query: {
        GetStoreById: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<GetStoreByIdResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { storeId } = param as GetStoreByIdInput;
                        const store = await StoreModel.findOne(storeId);

                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }

                        if (store.expiresAt) {
                            throw new ApolloError(
                                "삭제된 상점입니다.",
                                ERROR_CODES.DELETED_STORE
                            );
                        }
                        if (!store.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "Store 접근권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE
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
        )
    }
};
export default resolvers;
