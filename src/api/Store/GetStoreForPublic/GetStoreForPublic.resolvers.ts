import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetStoreForPublicResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStore
} from "../../../utils/resolverFuncWrapper";

export const GetStoreForPublicFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetStoreForPublicResponse> => {
    try {
        const { store } = req;
        return {
            ok: true,
            error: null,
            data: store as any
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetStoreForPublic: defaultResolver(
            privateResolverForStore(GetStoreForPublicFunc)
        )
    }
};
export default resolvers;
