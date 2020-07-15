import { BaseSchema, createSchemaOptions } from "../../abs/BaseSchema";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../__collectionNames";
import { ObjectId } from "mongodb";
import {
    PaymentStatus,
    RefundStatus,
    TransactionHistoryItem,
    TransactionItem
} from "../../types/graph";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.TRANSACTION)))
export class TransactionCls extends BaseSchema {
    @prop({
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    sellerId: ObjectId;

    @prop({
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    storeId: ObjectId;

    @prop()
    transactionItem: TransactionItem;

    @prop()
    amount: number;

    @prop({
        set: id => new ObjectId(id),
        get: id => new ObjectId(id)
    })
    storeUserId: ObjectId;

    @prop()
    paymethod: string;

    @prop()
    count: number;

    @prop()
    history: TransactionHistoryItem[];

    @prop()
    paymentStatus: PaymentStatus;

    @prop()
    refundStatus: RefundStatus;
}

export const TransactionModel = getModelForClass(TransactionCls);
