import { Resolvers } from "../../../types/resolvers";
import { GetStoreUsersProfileResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";

export const GetStoreUsersProfileFunc = async (
    { context: { req } },
    stack: any[]
): Promise<GetStoreUsersProfileResponse> => ({
    ok: true,
    error: null,
    data: req.storeUser
});

const resolvers: Resolvers = {
    Query: {
        GetStoreUsersProfile: defaultResolver(
            privateResolverForStoreUser(GetStoreUsersProfileFunc)
        )
    }
};
export default resolvers;
