import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetItemsForAnonymousResponse,
    GetItemsForAnonymousQueryArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { makeFilterQuery } from "../GetItems/itemFilter";
import { ItemModel } from "../../../models/Item/Item";
import { StoreGroupCls } from "../../../models/StoreGroup";

export const GetItemsForAnonymousFunc = async ({
    args,
    context: { req }
}): Promise<GetItemsForAnonymousResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            storeGroup
        }: {
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const { filter } = args as GetItemsForAnonymousQueryArgs;
        const query = makeFilterQuery(filter, 9);

        const items = await ItemModel.find({
            storeId: {
                $in: storeGroup.list
            },
            expiresAt: {
                $exists: false
            },
            ...query
        }).sort({ createdAt: -1 });

        return {
            ok: true,
            error: null,
            data: items as any
        };
    } catch (error) {
        const result = await errorReturn(error, session);
        return {
            ...result,
            data: []
        };
    }
};

const resolvers: Resolvers = {
    Query: {
        GetItemsForAnonymous: defaultResolver(
            privateResolverForStoreGroup(GetItemsForAnonymousFunc)
        )
    }
};
export default resolvers;
