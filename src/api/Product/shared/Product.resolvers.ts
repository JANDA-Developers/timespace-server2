import { Resolvers } from "../../../types/resolvers";
import { ProductCls } from "../../../models/Product";
import { DocumentType } from "@typegoose/typegoose";
import { StoreModel } from "../../../models/Store";

const resolvers: Resolvers = {
    Product: {
        store: async (product: DocumentType<ProductCls>) => {
            return await StoreModel.findById(product.storeId);
        }
    }
};

export default resolvers;
