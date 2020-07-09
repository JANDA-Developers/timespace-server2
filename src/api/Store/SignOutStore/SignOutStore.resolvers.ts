import { DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { SignOutStoreResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { StoreCls } from "../../../models/Store/Store";
import { StoreGroupCls } from "../../../models/StoreGroup";

export const SignOutStoreFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<SignOutStoreResponse> => {
    try {
        const {
            storeGroup
        }: {
            store: DocumentType<StoreCls>;
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const storeGroupCode = storeGroup.code;

        if (req.session.storeGroupUsers) {
            req.session.storeGroupUsers[storeGroupCode] = undefined;
        }
        console.time("signOutStore_1");
        req.session.save(err => {
            if (err) {
                throw new err();
            }
        });

        console.timeEnd("signOutStore_1");
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        SignOutStore: defaultResolver(
            privateResolverForStoreGroup(SignOutStoreFunc)
        )
    }
};
export default resolvers;
