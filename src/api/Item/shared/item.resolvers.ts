import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { ItemCls } from "../../../models/Item";
import { StoreModel } from "../../../models/Store";
import { ProductModel } from "../../../models/Product";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    Item: {
        store: async (item: DocumentType<ItemCls>) => {
            return await StoreModel.findById(item.storeId);
        },
        product: async (item: DocumentType<ItemCls>) => {
            return await ProductModel.findById(item.productId);
        },
        buyer: async (item: DocumentType<ItemCls>, args, { req }) => {
            const user = await UserModel.findById(item.buyerId);
            if (user) {
                await user.setAttributesFronCognito();
            }
            return user;
        },
        dateTimeRange: async (item: DocumentType<ItemCls>) => {
            console.log({
                sdfdsf: item.dateTimeRange
            });
            return item.dateTimeRange;
        }
    }
};
export default resolvers;
