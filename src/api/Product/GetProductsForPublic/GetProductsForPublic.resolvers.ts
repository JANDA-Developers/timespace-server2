import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetProductsForPublicResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product/Product";

export const GetProductsForPublicFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetProductsForPublicResponse> => {
    try {
        const { store } = req;
        return {
            ok: true,
            error: null,
            data: (await ProductModel.find({
                _id: {
                    $in: store.products
                }
            })) as any
        };
    } catch (error) {
        const result = await errorReturn(error);
        return {
            ...result,
            data: []
        };
    }
};

const resolvers: Resolvers = {
    Query: {
        GetProductsForPublic: defaultResolver(
            privateResolverForStoreGroup(GetProductsForPublicFunc)
        )
    }
};
export default resolvers;
