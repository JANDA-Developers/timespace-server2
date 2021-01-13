"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Store_1 = require("../../../models/Store/Store");
const Product_1 = require("../../../models/Product/Product");
const resolvers = {
    Query: {
        GetProductsForBuyer: resolverFuncWrapper_1.defaultResolver(async ({ args: { param } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { storeCode } = param;
                const store = await Store_1.StoreModel.findByCode(storeCode);
                const products = await Product_1.ProductModel.find({
                    _id: {
                        $in: store.products
                    },
                    expiresAt: {
                        $exists: false
                    }
                });
                return {
                    ok: true,
                    error: null,
                    data: products
                };
            }
            catch (error) {
                const result = await utils_1.errorReturn(error, session);
                return {
                    ...result,
                    data: []
                };
            }
        })
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetProductsForBuyer.resolvers.js.map