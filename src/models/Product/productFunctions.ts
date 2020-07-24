import { ObjectId } from "mongodb";
import { DocumentType } from "@typegoose/typegoose";
import { ProductCls, ProductModel } from "./Product";

export const findProduct = async (
    productId: ObjectId | string
): Promise<DocumentType<ProductCls>> => {
    const product = await ProductModel.findById(productId);
    if (!product) {
        throw new Error("존재하지 않는 ProductId");
    }
    return product;
};
