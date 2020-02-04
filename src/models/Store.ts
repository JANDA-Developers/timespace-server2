import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.STORE)))
export class StoreCls extends BaseSchema {
    @prop()
    userSub: string;

    @prop()
    name: string;

    @prop()
    storeCode: string;

    @prop()
    itemIds: ObjectId[];
}

export const StoreModel = getModelForClass(StoreCls);
