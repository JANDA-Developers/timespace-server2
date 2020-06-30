import { ApolloError } from "apollo-server";
import { DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetItemForStoreUserResponse,
    GetItemForStoreUserQueryArgs
} from "GraphType";
import {
    privateResolverForStoreUser,
    defaultResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { StoreUserCls } from "../../../models/StoreUser";

export const GetItemForStoreUserFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetItemForStoreUserResponse> => {
    try {
        const { storeUser }: { storeUser: DocumentType<StoreUserCls> } = req;
        const { itemCode } = args as GetItemForStoreUserQueryArgs;
        const item = await ItemModel.findByCode(itemCode);
        if (!item.storeId.equals(storeUser.storeId)) {
            throw new ApolloError(
                "접근 권한이 없습니다.",
                ERROR_CODES.ACCESS_DENY_ITEM,
                {
                    storeUser
                }
            );
        }

        return {
            ok: true,
            error: null,
            data: item as any
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetItemForStoreUser: defaultResolver(
            privateResolverForStoreUser(GetItemForStoreUserFunc)
        )
    }
};
export default resolvers;
