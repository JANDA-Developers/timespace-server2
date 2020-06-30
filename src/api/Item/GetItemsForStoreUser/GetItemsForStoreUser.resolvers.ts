import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetItemsForStoreUserResponse,
    GetItemsForStoreUserQueryArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { makeFilterQuery } from "../GetItems/itemFilter";
import { ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";

export const GetItemsForStoreUserFunc = async ({
    args,
    context: { req }
}): Promise<GetItemsForStoreUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser } = req;
        const { filter } = args as GetItemsForStoreUserQueryArgs;
        const query = makeFilterQuery(filter, storeUser.zoneinfo.offset);

        const items = await ItemModel.find({
            storeUserId: new ObjectId(storeUser._id),
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
        GetItemsForStoreUser: defaultResolver(
            privateResolverForStoreUser(GetItemsForStoreUserFunc)
        )
    }
};
export default resolvers;
