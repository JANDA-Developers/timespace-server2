import { Resolvers } from "../../../types/resolvers";
import { ProductCls } from "../../../models/Product";
import { DocumentType } from "@typegoose/typegoose";
import { StoreModel } from "../../../models/Store";
import { UserModel } from "../../../models/User";
import { ProductSchedules } from "../../../types/graph";

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
        },
        items: async (product: DocumentType<ProductCls>, { date }) => {
            const result = await product.getItems(date);
            console.log(result.map(r => r.dateTimeRange));
            return result;
        },
        schedules: async (
            product: DocumentType<ProductCls>,
            { dateTime }
        ): Promise<ProductSchedules> => {
            return await product.getSchedulesByDate(dateTime);
        },
        intro: product => {
            if (!product.intro) {
                return "";
            } else {
                return product.intro;
            }
        },
        warning: product => {
            if (!product.warning) {
                return "";
            } else {
                return product.warning;
            }
        }
    }
};

export default resolvers;
