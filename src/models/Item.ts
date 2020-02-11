import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { genItemCode } from "./utils/genId";
import { ProductModel } from "./Product";
import { DateTimeRange } from "../types/graph";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.SALES)))
export class ItemCls extends BaseSchema {
    async setCode(this: DocumentType<ItemCls>, productCode: string) {
        await ProductModel.findByCode(productCode);
        this.code = genItemCode(productCode, new Date());
    }

    @prop()
    name: string;

    @prop({ required: true })
    code: string;

    @prop()
    storeId: ObjectId;

    @prop()
    buyer: ObjectId;

    @prop({
        defualt: undefined
    })
    dateRange?: DateTimeRange;
}

export const ItemModel = getModelForClass(ItemCls);
