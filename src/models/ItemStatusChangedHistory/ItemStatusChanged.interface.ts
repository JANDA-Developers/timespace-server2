import { BaseSchema } from "../../abs/BaseSchema";
import { ItemStatus } from "../../types/graph";
import { ObjectId } from "mongodb";
import { DocumentType } from "@typegoose/typegoose";
import { ItemStatusChangedCls } from "./ItemStatusChanged";
import { ClientSession } from "mongoose";

export interface ItemStatusHistoryProps extends BaseSchema {
    type: string;
    status: ItemStatus;
    comment: string;
    workerId: ObjectId;
    itemId: ObjectId;
}

export interface ItemStatusHistoryFuncs {
    /**
     * 해당 status를 item에 다시 적용함.
     */
    applyItemWithThis: (
        session?: ClientSession
    ) => Promise<DocumentType<ItemStatusChangedCls>>;
}
