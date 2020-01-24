import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SALES)))
export class SalesCls extends BaseSchema {
    @prop()
    name: string;
}

export const SalesModel = getModelForClass(SalesCls);
