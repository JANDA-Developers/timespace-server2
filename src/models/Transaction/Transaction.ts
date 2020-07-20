import { BaseSchema, createSchemaOptions } from "../../abs/BaseSchema";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../__collectionNames";
import { ObjectId } from "mongodb";
import {
    PaymentStatus,
    RefundStatus,
    TransactionHistoryItem,
    AmountInfo
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
    itemId: ObjectId;

    @prop({
        required: true,
        default: {
            origin: 0,
            paid: 0,
            refunded: 0
        } as AmountInfo
    })
    amountInfo: AmountInfo;

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

    @prop({ default: (): PaymentStatus => "NONE" })
    paymentStatus: PaymentStatus;

    @prop({ default: (): RefundStatus => "NONE" })
    refundStatus: RefundStatus;
}

export const TransactionModel = getModelForClass(TransactionCls);
