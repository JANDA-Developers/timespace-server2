import { DateTimeRangeCls } from "../../utils/DateTimeRange";
import { ItemCls } from "../Item/Item";
import {
    Segment,
    ProductSchedules,
    PeriodOption,
    GenderOption,
    ItemStatus
} from "../../types/graph";
import { ObjectId } from "mongodb";
import { DocumentType } from "@typegoose/typegoose";
import { PeriodWithDays } from "../../utils/PeriodWithDays";
import { BaseSchema } from "../../abs/BaseSchema";
import { ItemProps } from "../Item/Item.interface";

export interface ProductProps extends BaseSchema {
    userId: ObjectId;
    storeId: ObjectId;
    name: string;
    code: string;
    images: string[];
    description: string;
    needToConfirm: boolean;
    usingPeriodOption: boolean;
    usingCapacityOption: boolean;
    capacity: number;
    genderOption: GenderOption;
    intro: string;
    warning: string;
    businessHours: Array<PeriodWithDays>;
    periodOption: PeriodOption;
}

export interface ProductFuncs {
    /**
     * 스케줄 구하는 함수
     */
    getSchedulesByDate(date: Date): Promise<ProductSchedules | null>;
    getItems(
        date: Date,
        status?: ItemStatus
    ): Promise<Array<DocumentType<ItemCls>>>;
    getSegmentSchedules(
        dateTimeRange: DateTimeRangeCls
    ): Promise<
        {
            itemCount: number;
            segment: Segment;
            maxCount: number;
            soldOut: boolean;
            items: ObjectId[];
        }[]
    >;
    segmentListWithItems(
        dateTimeRange: DateTimeRangeCls,
        unit: number
    ): Promise<
        {
            _id: number; // * 1000 하면 segment.from 이랑 같아짐
            items: ItemProps[];
            segment: Segment;
            count: number;
            maxCount: number;
            soldOut: boolean;
        }[]
    >;
}
