import { BaseSchema, createSchemaOptions } from "../../abs/BaseSchema";
import {
    getModelForClass,
    modelOptions,
    prop,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../__collectionNames";
import {
    ItemStatusHistoryProps,
    ItemStatusHistoryFuncs
} from "./ItemStatusChanged.interface";
import { ObjectId } from "mongodb";
import { ItemStatus } from "GraphType";
import { ClientSession } from "mongoose";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../types/values";

@modelOptions(
    createSchemaOptions(getCollectionName(ModelName.ITEM_STATUS_CHANGE))
)
export class ItemStatusChangedCls extends BaseSchema
    implements ItemStatusHistoryProps, ItemStatusHistoryFuncs {
    static findLastestOne = async (
        itemId: ObjectId
    ): Promise<DocumentType<ItemStatusChangedCls> | null> => {
        const itemStatus = await ItemStatusChangedHistoryModel.findOne({
            itemId
        }).sort({ updatedAt: -1 });
        return itemStatus;
    };

    async applyItemWithThis(
        this: DocumentType<ItemStatusChangedCls>,
        session?: ClientSession
    ): Promise<DocumentType<ItemStatusChangedCls>> {
        // const item = await ItemModel.findById();
        throw new ApolloError("개발중", ERROR_CODES.UNDERDEVELOPMENT);
    }

    @prop({ default: "ITEM" })
    type: string;

    @prop()
    status: ItemStatus;

    @prop({
        get: id => new ObjectId(id),
        set: id => new ObjectId(id)
    })
    workerId: ObjectId;

    @prop()
    comment: string;

    @prop({
        get: id => new ObjectId(id),
        set: id => new ObjectId(id)
    })
    itemId: ObjectId;
}

export const ItemStatusChangedHistoryModel = getModelForClass(
    ItemStatusChangedCls
);
