import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetItemByCodeResponse, GetItemByCodeQueryArgs } from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item/Item";
import { StoreGroupCls } from "../../../models/StoreGroup";

export const GetItemByCodeFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetItemByCodeResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            storeGroup
        }: {
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const { itemCode } = args as GetItemByCodeQueryArgs;
        const item = await ItemModel.findByCode(itemCode);
        const isSellersStore = storeGroup.list.find(storeId =>
            storeId.equals(item.storeId)
        );
        if (!isSellersStore) {
            return {
                ok: true,
                error: null,
                data: null
            };
        }
        return {
            ok: true,
            error: null,
            data: item as any
        };
    } catch (error) {
        return errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetItemByCode: defaultResolver(
            privateResolverForStoreGroup(GetItemByCodeFunc)
        )
    }
};
export default resolvers;
