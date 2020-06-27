import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { StoreSignOutResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStore
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreCls } from "../../../models/Store/Store";

export const StoreSignOutFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<StoreSignOutResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
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

        await session.commitTransaction();
        session.endSession();
        throw new ApolloError("개발중", ERROR_CODES.UNDERDEVELOPMENT);
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        StoreSignOut: defaultResolver(privateResolverForStore(StoreSignOutFunc))
    }
};
export default resolvers;
