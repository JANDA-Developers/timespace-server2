import { Resolvers } from "../../../types/resolvers";
import { GetMyProfileStoreUserResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";

export const GetMyProfileStoreUserFunc = async (
    { context: { req } },
    stack: any[]
): Promise<GetMyProfileStoreUserResponse> => ({
    ok: true,
    error: null,
    data: req.storeUser
});

const resolvers: Resolvers = {
    Query: {
        GetMyProfileStoreUser: defaultResolver(
            privateResolverForStoreUser(GetMyProfileStoreUserFunc)
        )
    }
};
export default resolvers;
