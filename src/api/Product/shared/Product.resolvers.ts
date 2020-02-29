import { Resolvers } from "../../../types/resolvers";
import { ProductCls } from "../../../models/Product/Product";
import { DocumentType } from "@typegoose/typegoose";
import { StoreModel } from "../../../models/Store/Store";
import { UserModel } from "../../../models/User";
import { ProductSchedules } from "GraphType";
import { ItemModel } from "../../../models/Item/Item";

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
            await user.setAttributesFromCognito();
            return user;
        },
        items: async (product: DocumentType<ProductCls>, { date, status }) => {
            try {
                const result = await product.getItems(date, status);
                return result;
            } catch {
                return [];
            }
        },
        totalItemCount: async (product: DocumentType<ProductCls>) => {
            const itemCount = await ItemModel.find({
                productId: product._id,
                expiresAt: {
                    $exists: false
                }
            }).countDocuments();
            return itemCount || 0;
        },
        schedules: async (
            product: DocumentType<ProductCls>,
            { date, soldOut }
        ): Promise<ProductSchedules | null> => {
            console.log({
                dateFromSchedules: date
            });
            const result = await product.getSchedulesByDate(
                date,
                soldOut === null ? undefined : soldOut
            );
            return result;
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
