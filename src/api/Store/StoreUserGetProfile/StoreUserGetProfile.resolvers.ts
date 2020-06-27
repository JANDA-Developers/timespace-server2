import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { StoreUserGetProfileResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";

export const StoreUserGetProfileFunc = async (
    { context: { req } },
    stack: any[]
): Promise<StoreUserGetProfileResponse> => {
    try {
        const { storeUser } = req;
        return {
            ok: true,
            error: null,
            data: storeUser as any
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        StoreUserGetProfile: defaultResolver(
            privateResolverForStoreUser(StoreUserGetProfileFunc)
        )
    }
};
export default resolvers;
