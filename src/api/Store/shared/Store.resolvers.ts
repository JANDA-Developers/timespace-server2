import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { StoreCls } from "../../../models/Store/Store";
import { ProductModel } from "../../../models/Product/Product";
import { UserModel } from "../../../models/User";
import { StoreGroupModel } from "../../../models/StoreGroup";

const resolvers: Resolvers = {
    Store: {
        user: async (store: DocumentType<StoreCls>, args, { req }) => {
            const user = await UserModel.findById(store.userId);
            if (user) {
                await user.setAttributesFromCognito();
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
        groups: async (store: DocumentType<StoreCls>) => {
            const groups = await StoreGroupModel.find({
                _id: {
                    $in: store.groupIds
                }
            });
            return groups;
        }
    }
};
export default resolvers;
