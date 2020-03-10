import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { ItemCls, ItemModel } from "../../../models/Item/Item";
import { StoreModel } from "../../../models/Store/Store";
import { ProductModel } from "../../../models/Product/Product";
import { UserModel } from "../../../models/User";
import {
    ItemStatusChangedHistoryModel,
    ItemStatusChangedCls
} from "../../../models/ItemStatusChangedHistory/ItemStatusChanged";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { BuyerModel } from "../../../models/Buyer";

const resolvers: Resolvers = {
    Item: {
        store: async (item: DocumentType<ItemCls>) => {
            return await StoreModel.findById(item.storeId);
        },
        product: async (item: DocumentType<ItemCls>) => {
            return await ProductModel.findById(item.productId);
        },
        user: async (item: DocumentType<ItemCls>, args, { req }) => {
            const user = await UserModel.findById(item.userId);
            if (user) {
                await user.setAttributesFromCognito();
            }
            return user;
        },
        buyer: async (item: DocumentType<ItemCls>, args, { req }) => {
            const buyer = await BuyerModel.findById(item.buyerId);
            if (buyer) {
                await buyer.setAttributesFromCognito();
            }
            return buyer;
        },
        dateTimeRange: async (item: DocumentType<ItemCls>) => {
            return item.dateTimeRange;
        },
        statusChangedHistory: async (item: DocumentType<ItemCls>) => {
            const history = await ItemStatusChangedHistoryModel.find({
                _id: { $in: item.statusChangedHistory }
            }).sort({ createdAt: -1 });
            return history;
        }
    },
    ItemStatusChanged: {
        worker: async (obj: DocumentType<ItemStatusChangedCls>) => {
            const user = await UserModel.findById(obj.workerId);
            if (!user) {
                throw new ApolloError(
                    "존재하지 않는 User",
                    ERROR_CODES.UNEXIST_USER,
                    {
                        loc: "ItemStatusChanged.worker",
                        data: obj
                    }
                );
            }
            await user.setAttributesFromCognito();
            return user;
        },
        date: async (obj: DocumentType<ItemStatusChangedCls>) => {
            return obj.createdAt;
        },
        item: async (obj: DocumentType<ItemStatusChangedCls>) => {
            const item = await ItemModel.findById(obj.itemId);
            if (!item) {
                throw new ApolloError(
                    "존재하지 않는 ItemId",
                    ERROR_CODES.UNEXIST_ITEM,
                    {
                        loc: "ItemStatusChanged.item",
                        data: obj
                    }
                );
            }
            return item;
        }
    }
};
export default resolvers;
