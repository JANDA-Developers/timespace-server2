"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProduct = void 0;
const Product_1 = require("./Product");
exports.findProduct = async (productId) => {
    const product = await Product_1.ProductModel.findById(productId);
    if (!product) {
        throw new Error("존재하지 않는 ProductId");
    }
    return product;
};
//# sourceMappingURL=productFunctions.js.map