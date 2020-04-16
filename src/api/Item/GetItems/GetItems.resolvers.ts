import { ApolloError } from "apollo-server";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetItemsResponse, GetItemsInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreModel } from "../../../models/Store/Store";
import { ItemModel } from "../../../models/Item/Item";
import { makeFilterQuery } from "./itemFilter";

const resolvers: Resolvers = {
    Query: {
        GetItems: defaultResolver(
            privateResolver(
                async (
                    { parent, info, args, context: { req } },
                    stack
                ): Promise<GetItemsResponse> => {
                    try {
                        const { cognitoUser } = req;
                        const { param }: { param: GetItemsInput } = args;
                        const store = await StoreModel.findById(param.storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 StoreId",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }
                        if (!store.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "접근 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE
                            );
                        }
                        const query = makeFilterQuery(
                            param.filter,
                            store.periodOption.offset
                        );
                        const items = await ItemModel.find({
                            storeId: store._id,
                            ...query,
                            expiresAt: { $exists: false }
                        }).sort({ createdAt: -1 });

                        return {
                            ok: true,
                            error: null,
                            data: items as any
                        };
                    } catch (error) {
                        const result = await errorReturn(error);
                        return {
                            ...result,
                            data: []
                        };
                    }
                }
            )
        )
    }
};

export default resolvers;
