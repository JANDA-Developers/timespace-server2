import { DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { SignOutStoreResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStore
} from "../../../utils/resolverFuncWrapper";
import { StoreCls } from "../../../models/Store/Store";

export const SignOutStoreFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<SignOutStoreResponse> => {
    try {
        const { store }: { store: DocumentType<StoreCls> } = req;
        const storeCode = store.code;

        if (req.session.storeUsers) {
            req.session.storeUsers[storeCode] = undefined;
        }
        req.session.save(err => {
            if (err) {
                throw new err();
            }
        });

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
        SignOutStore: defaultResolver(privateResolverForStore(SignOutStoreFunc))
    }
};
export default resolvers;
