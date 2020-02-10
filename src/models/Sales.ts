import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SALES)))
export class SalesCls extends BaseSchema {
    @prop()
    name: string;

    @prop({
        default: () => ""
    })
    code: string;

    @prop()
    storeId: ObjectId;

    @prop()
    buyer: ObjectId;
}

export const SalesModel = getModelForClass(SalesCls);
