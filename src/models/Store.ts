import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.STORE)))
export class StoreCls extends BaseSchema {
    @prop()
    name: string;
}

export const StoreModel = getModelForClass(StoreCls);
