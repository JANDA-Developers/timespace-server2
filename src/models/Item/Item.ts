import { BaseSchema, createSchemaOptions } from "../../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../__collectionNames";
import { ObjectId } from "mongodb";
import { genItemCode } from "../utils/genId";
import { ProductModel } from "../Product/Product";
import { DateTimeRangeCls } from "../../utils/DateTimeRange";
import { DateTimeRange, CustomFieldValue, CustomFieldInput } from "GraphType";
import { ItemProps, ItemFuncs } from "./Item.interface";
import { StoreModel } from "../Store/Store";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../types/values";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ITEM)))
export class ItemCls extends BaseSchema implements ItemProps, ItemFuncs {
    @prop()
    name: string;

    @prop({ required: true })
    code: string;

    @prop({
        required: true,
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    storeId: ObjectId;

    @prop({
        required: true,
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    productId: ObjectId;

    @prop({
        required: true,
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    buyerId: ObjectId;

    @prop({
        set: v => v,
        get: v => {
            return new DateTimeRangeCls(v);
        }
    })
    dateTimeRange: DateTimeRange;

    @prop()
    memo: string;

    async setCode(
        this: DocumentType<ItemCls>,
        productCode: string,
        date = new Date()
    ) {
        await ProductModel.findByCode(productCode);
        this.code = genItemCode(productCode, date);
    }

    @prop({
        default: [],
        async set(this: DocumentType<ItemCls>, cf: CustomFieldInput[]) {
            const store = await StoreModel.findOne({
                storeId: this.storeId,
                expiresAt: {
                    $exists: false
                }
            });
            if (!store) {
                throw new ApolloError(
                    "존재하지 않거나 삭제된 Store",
                    ERROR_CODES.UNEXIST_STORE,
                    {
                        store
                    }
                );
            }

            return cf.map(c => {
                const key = new ObjectId(c.key);
                const field = store.customFields.find(cf => key.equals(cf.key));
                return {
                    key,
                    label: (field && field.label) || "",
                    value: c.value
                };
            });
        },
        get(this: DocumentType<ItemCls>, cf: CustomFieldInput[]) {
            return cf.map(c => {
                return {
                    key: new ObjectId(c.key),
                    value: c.value
                };
            });
        }
    })
    customFieldValues: CustomFieldValue[];

    @prop()
    phoneNumber: string;
}

export const ItemModel = getModelForClass(ItemCls);
