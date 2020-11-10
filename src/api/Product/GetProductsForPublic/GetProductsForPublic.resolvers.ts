import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetProductsForPublicResponse,
    GetProductsForPublicQueryArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product/Product";
import { DocumentType } from "@typegoose/typegoose";
import { StoreModel } from "../../../models/Store/Store";
import { StoreGroupCls } from "../../../models/StoreGroup";

export const GetProductsForPublicFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetProductsForPublicResponse> => {
    try {
        const {
            storeGroup
        }: {
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const { filter } = args as GetProductsForPublicQueryArgs;
        const queryFilter = {
            _id: {
                $in: storeGroup.list
            }
        } as any;
        if (filter?.storeCodes) {
            queryFilter.code = {
                $in: filter.storeCodes
            };
        }
        const stores = await StoreModel.find(queryFilter);
        return {
            ok: true,
            error: null,
            data: (await ProductModel.find({
                _id: {
                    $in: stores.flatMap(item => item.products)
                },
                isDeleted: {
                    $ne: true
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
