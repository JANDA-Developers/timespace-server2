import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { ItemCls } from "../../../models/Item";
import { StoreModel } from "../../../models/Store";
import { ProductModel } from "../../../models/Product";

const resolvers: Resolvers = {
    Item: {
        store: async (item: DocumentType<ItemCls>) => {
            return await StoreModel.findById(item.storeId);
        },
        product: async (item: DocumentType<ItemCls>) => {
            return await ProductModel.findById(item.productId);
        }
    }
};
export default resolvers;
