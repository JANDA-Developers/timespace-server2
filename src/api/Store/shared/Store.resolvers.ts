import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { StoreCls } from "../../../models/Store";
import { ProductModel } from "../../../models/Product";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    Store: {
        user: async (store: DocumentType<StoreCls>, args, { req }) => {
            const user = await UserModel.findById(store.userId);
            if (user) {
                await user.setAttributesFronCognito();
            }
            return user;
        },
        products: async (store: DocumentType<StoreCls>) => {
            return await ProductModel.find({
                _id: {
                    $in: store.products
                    // .map(productId => new ObjectId(productId))
                }
            });
        },
        productCount: (store: DocumentType<StoreCls>) => {
            return (store.products && store.products.length) || 0;
        },
        businessHours: (store: DocumentType<StoreCls>) => {
            console.log(
                "Store.Businesshours ======================================"
            );
            console.log(store);
            return store.businessHours;
        }
    }
};
export default resolvers;
