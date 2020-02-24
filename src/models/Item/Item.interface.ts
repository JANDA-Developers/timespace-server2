import { ObjectId } from "mongodb";
import { BaseSchema } from "../../abs/BaseSchema";
import { DateTimeRange, ItemStatus } from "../../types/graph";
import { DocumentType } from "@typegoose/typegoose";
import { ItemStatusChangedCls } from "../ItemStatusChangedHistory/ItemStatusChanged";

export type ItemStatusInfoType = {
    status: ItemStatus;
    comment: string;
    userId: ObjectId;
    date: Date;
};

export interface ItemProps extends BaseSchema {
    name: string;
    code: string;
    storeId: ObjectId;
    productId: ObjectId;
    buyerId: ObjectId;
    dateTimeRange: DateTimeRange;
    memo: string;
    status: ItemStatus;
}

export interface ItemFuncs {
    setCode(productCode: string, date: Date): void;
    applyStatus(
        status: ItemStatus,
        options: {
            comment?: string;
            userId?: ObjectId;
        }
    ): DocumentType<ItemStatusChangedCls>;
}
