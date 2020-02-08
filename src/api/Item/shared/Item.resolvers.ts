import { Resolvers } from "../../../types/resolvers";
import { ItemCls } from "../../../models/Item";
import { DocumentType } from "@typegoose/typegoose";
import { StoreModel } from "../../../models/Store";

const resolvers: Resolvers = {
    Item: {
        store: async (item: DocumentType<ItemCls>) => {
            return await StoreModel.findById(item.storeId);
        }
    }
};

export default resolvers;
