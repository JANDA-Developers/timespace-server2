import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ITEM)))
export class ItemCls extends BaseSchema {
    @prop()
    name: string;

    @prop()
    storeId: ObjectId;

    @prop()
    itemCode: string;

    @prop()
    images: string[];

    @prop()
    description: string;

    /*
     * =============================================================================================================================
     *
     * Optional Fields
     *
     * =============================================================================================================================
     */

    @prop()
    constraints: any[];
}

export const ItemModel = getModelForClass(ItemCls);
