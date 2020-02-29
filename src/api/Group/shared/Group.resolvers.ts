import { Resolvers } from "../../../types/resolvers";
import { UserModel } from "../../../models/User";
import { StoreModel } from "../../../models/Store/Store";
import { ProductModel } from "../../../models/Product/Product";
const resolvers: Resolvers = {
    BaseGroup: {
        __resolveType: (group: any) => {
            switch (group.type) {
                case "STORE_GROUP":
                    return "StoreGroup";
                case "PRODUCT_GROUP":
                default:
                    return "ProductGroup";
            }
        },
        user: async (group: any) => {
            const user = await UserModel.findById(group.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFromCognito();
            return user;
        }
    },
    StoreGroup: {
        user: async (group: any) => {
            const user = await UserModel.findById(group.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFromCognito();
            return user;
        },
        list: async (group: any) => {
            return await StoreModel.find({
                _id: {
                    $in: group.list
                }
            });
        }
    },
    ProductGroup: {
        user: async (group: any) => {
            const user = await UserModel.findById(group.userId);
            if (!user) {
                return null;
            }
            await user.setAttributesFromCognito();
            return user;
        },
        list: async (group: any) => {
            return await ProductModel.find({
                _id: {
                    $in: group.list
                }
            });
        }
    }
};

export default resolvers;
