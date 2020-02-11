import { Resolvers } from "../../../types/resolvers";
import { ProductCls } from "../../../models/Product";
import { DocumentType } from "@typegoose/typegoose";
import { StoreModel } from "../../../models/Store";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    Product: {
        store: async (product: DocumentType<ProductCls>) => {
            return await StoreModel.findById(product.storeId);
        },
        user: async (product: DocumentType<ProductCls>) => {
            const user = await UserModel.findById(product.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFronCognito();
            return user;
        }
    }
};

export default resolvers;
