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
import { DateTimeRange, ItemStatus } from "GraphType";
import { ItemProps, ItemFuncs } from "./Item.interface";
import {
    ItemStatusChangedCls,
    ItemStatusChangedHistoryModel
} from "../ItemStatusChangedHistory/ItemStatusChanged";
import { ItemStatusHistoryProps } from "../ItemStatusChangedHistory/ItemStatusChanged.interface";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../types/values";
import { CustomFieldValueCls } from "../../types/types";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ITEM)))
export class ItemCls extends BaseSchema implements ItemProps, ItemFuncs {
    static async findByCode(itemCode: string): Promise<DocumentType<ItemCls>> {
        const item = await ItemModel.findOne({
            code: itemCode
        });
        if (!item) {
            throw new ApolloError(
                "존재하지 않는 itemCode입니다",
                ERROR_CODES.UNEXIST_ITEM
            );
        }
        return item;
    }

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
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    buyerId: ObjectId;

    @prop({
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    userId: ObjectId;

    @prop({
        set: v => v,
        get: v => {
            return new DateTimeRangeCls(v);
        }
    })
    dateTimeRange: DateTimeRange;

    @prop()
    memo: string;

    @prop()
    transactionId?: ObjectId;

    @prop({ default: () => false })
    isExtend: boolean;

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
        set(this: DocumentType<ItemCls>, cf: any[]) {
            return cf.map(c => {
                const key = new ObjectId(c.key);
                return {
                    key,
                    type: c.type,
                    label: c.label || "",
                    value: c.value
                };
            });
        },
        get(this: DocumentType<ItemCls>, cf: any[]) {
            return cf.map(c => {
                return {
                    key: new ObjectId(c.key),
                    type: c.type,
                    label: c.label || "",
                    value: c.value
                };
            });
        }
    })
    customFieldValues: CustomFieldValueCls[];

    @prop()
    phoneNumber: string;

    @prop()
    storeUserId: ObjectId;

    @prop({ default: "PENDING" as ItemStatus })
    status: ItemStatus;

    @prop({
        default: () => [],
        get: ids => ids.map((id: any) => new ObjectId(id)),
        set: ids => ids.map((id: any) => new ObjectId(id))
    })
    statusChangedHistory: ObjectId[];

    @prop({ default: () => 1 })
    orderCount: number;

    // 처음 예약시에 status set! => product.needToConfirm 설정값에 따라서 달라짐
    async setStatusForDefault(this: DocumentType<ItemCls>) {
        const product = await ProductModel.findById(this.productId);
        if (!product) {
            throw new Error("Product is undefined in ItemCls");
        }
        const needToConfirm = product.needToConfirm;
        if (needToConfirm) {
            this.status = "PENDING";
        } else {
            this.status = "PERMITTED";
        }
    }

    applyStatus(
        status: ItemStatus,
        options: {
            comment?: string;
            workerId?: ObjectId;
        } = {}
    ): DocumentType<ItemStatusChangedCls> {
        if (this.status === status && this.status !== "PENDING") {
            throw new ApolloError(
                `이미 ${this.status} 상태 입니다.`,
                status === "PERMITTED"
                    ? ERROR_CODES.ALREADY_PERMITTED_ITEM
                    : ERROR_CODES.ALREADY_CANCELED_ITEM,
                {
                    loc: "Item.applyStatus",
                    data: {
                        currentItemStatus: this.status,
                        yourInput: status
                    }
                }
            );
        }
        if (this.status === "CANCELED" && status === "PERMITTED") {
            throw new ApolloError(
                "CANCELED 상태의 아이템은 PERMITTED 상태로 변경할 수 없습니다",
                ERROR_CODES.IMPOSIBLE_CHANGE_ITEM_STATUS,
                {
                    loc: "Item.applyStatus",
                    data: {
                        currentItemStatus: this.status,
                        yourInput: status
                    }
                }
            );
        }
        this.status = status;
        const itemStatusChangedHistory = new ItemStatusChangedHistoryModel({
            workerId: options.workerId && this.buyerId,
            comment: options.comment || "",
            type: "ITEM",
            status,
            itemId: this._id
        } as ItemStatusHistoryProps);
        const tempArr = [
            itemStatusChangedHistory._id,
            ...this.statusChangedHistory
        ];
        this.statusChangedHistory = tempArr;
        console.log(this);
        return itemStatusChangedHistory;
    }
}

export const ItemModel = getModelForClass(ItemCls);
