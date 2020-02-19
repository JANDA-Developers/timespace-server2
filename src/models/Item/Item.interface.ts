import { ObjectId } from "mongodb";
import { BaseSchema } from "../../abs/BaseSchema";
import { DateTimeRange } from "../../types/graph";

export interface ItemProps extends BaseSchema {
    name: string;
    code: string;
    storeId: ObjectId;
    productId: ObjectId;
    buyerId: ObjectId;
    dateTimeRange: DateTimeRange;
    memo: string;
}

export interface ItemFuncs {
    setCode(productCode: string, date: Date): void;
}
