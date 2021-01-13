"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProductsForPublicFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Product_1 = require("../../../models/Product/Product");
const Store_1 = require("../../../models/Store/Store");
exports.GetProductsForPublicFunc = async ({ parent, info, args, context: { req } }, stack) => {
    try {
        const { storeGroup } = req;
        const { filter } = args;
        const queryFilter = {
            _id: {
                $in: storeGroup.list
            }
        };
        if (filter === null || filter === void 0 ? void 0 : filter.storeCodes) {
            queryFilter.code = {
                $in: filter.storeCodes
            };
        }
        const stores = await Store_1.StoreModel.find(queryFilter);
        return {
            ok: true,
            error: null,
            data: (await Product_1.ProductModel.find({
                _id: {
                    $in: stores.flatMap(item => item.products)
                },
                isDeleted: {
                    $ne: true
                }
            }))
        };
    }
    catch (error) {
        const result = await utils_1.errorReturn(error);
        return {
            ...result,
            data: []
        };
    }
};
const resolvers = {
    Query: {
        GetProductsForPublic: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.GetProductsForPublicFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetProductsForPublic.resolvers.js.map