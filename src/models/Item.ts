import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ITEM)))
export class ItemCls extends BaseSchema {
    @prop()
    name: string;
}

export const ItemModel = getModelForClass(ItemCls);
