import { BaseSchema, createSchemaOptions } from "../../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../__collectionNames";
import { ObjectId } from "mongodb";
import { PeriodCls } from "../../utils/Period";
import {
    PeriodOption,
    ProductSchedules,
    Segment,
    Item,
    ItemStatus,
    Info,
    BookingPolicy
} from "GraphType";
import { genCode, s4 } from "../utils/genId";
import { ApolloError } from "apollo-server";
import {
    getPeriodFromDB,
    setPeriodToDB,
    getDateTimeRangeFromPeriodList,
    divideDateTimeRange
} from "../../utils/periodFuncs";
import { PeriodWithDays } from "../../utils/PeriodWithDays";
import { ItemCls, ItemModel } from "../Item/Item";
import { ERROR_CODES } from "../../types/values";
import { ONE_MINUTE } from "../../utils/dateFuncs";
import { DateTimeRangeCls } from "../../utils/DateTimeRange";
import { Stage } from "../../types/pipeline";
import _ from "lodash";
import { ProductProps, ProductFuncs } from "./Product.interface";
import { ItemProps } from "../Item/Item.interface";
import { removeUndefined } from "../../utils/objectFuncs";
import { segmentWithItemsPipeline } from "./pipelineForProduct";
import { propOptPeriodOption } from "../_propValidateOptions/propOptions";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.PRODUCT)))
export class ProductCls extends BaseSchema
    implements ProductProps, ProductFuncs {
    static findByCode = async (
        productCode: string
    ): Promise<DocumentType<ProductCls>> => {
        const product = await ProductModel.findOne({
            code: productCode
        });
        if (!product) {
            throw new ApolloError(
                "존재하지 않는 StoreCode입니다",
                "UNEXIST_ITEMCODE"
            );
        }
        return product;
    };

    @prop({
        required: [true, "[UNAUTHORIZED] 로그인 후 사용해주세요."],
        get: id => new ObjectId(id),
        set: id => new ObjectId(id)
    })
    userId: ObjectId;

    @prop({
        required: [true, "상점정보가 존재하지 않습니다."],
        get: id => new ObjectId(id),
        set: id => new ObjectId(id)
    })
    storeId: ObjectId;

    @prop()
    name: string;

    @prop()
    subTitle: string;

    @prop({
        default(this: DocumentType<ProductCls>) {
            return `${genCode(this.storeId)}-${s4(36).toUpperCase()}`;
        }
    })
    code: string;

    @prop({ default: [] })
    images: string[];

    @prop()
    description: string;

    @prop({ default: () => true })
    needToConfirm: boolean;

    @prop({ default: () => false })
    needToPermit: boolean;

    @prop({ default: () => false })
    usingPayment: boolean;

    @prop({ default: () => 0 })
    defaultPrice: number;

    @prop({ default: () => 0 })
    segmentPrice: number;

    /*
     ! =============================================================================================================================
     !
     ! Optional Fields
     !
     ! =============================================================================================================================
     */

    /*
     * =============================================================================================================================
     *
     * usingCapacityOption 종속 파라미터들
     *
     * =============================================================================================================================
     */
    @prop({
        default: () => 1,
        validate: [
            {
                validator: (v: number) => v >= 0,
                message: "capacity는 음수가 될 수 없습니다."
            }
        ],
        required: [true, "Capacity가 설정되지 않았습니다. "]
    })
    capacity: number;

    @prop()
    intro: string;

    @prop()
    warning: string;

    /*
     * =============================================================================================================================
     *
     * usingPeriodOption 종속 파라미터들
     *
     * =============================================================================================================================
     */
    @prop({
        validate: [
            {
                validator(
                    this: DocumentType<ProductCls>,
                    businessHours: Array<PeriodCls>
                ): boolean {
                    return (
                        businessHours.filter(
                            period => period.time < this.periodOption.max
                        ).length === 0
                    );
                },
                message:
                    "BusinessHours.time 값이 periodOption.max보다 작습니다."
            },
            {
                validator(
                    this: DocumentType<ProductCls>,
                    businessHours: Array<PeriodCls>
                ): boolean {
                    const unit = this.periodOption.unit;
                    return (
                        businessHours.filter(({ time }) => time % unit !== 0)
                            .length === 0
                    );
                },
                message: "BusinessHours.time 값이 unit의 배수가 아닙니다."
            },
            {
                validator(
                    this: DocumentType<ProductCls>,
                    businessHours: Array<PeriodCls>
                ): boolean {
                    return (
                        businessHours.filter(({ start, end }) => start >= end)
                            .length === 0
                    );
                },
                message: "end값이 start보다 작거나 같습니다."
            }
        ],
        required: [true, "BusinessHours가 설정되지 않았습니다."],
        get(this: DocumentType<ProductCls>, periodArr: Array<PeriodCls>) {
            return getPeriodFromDB(periodArr, this.periodOption.offset);
        },
        set(
            this: DocumentType<ProductCls>,
            periodArr: Array<PeriodWithDays>
        ): Array<PeriodCls> {
            try {
                return setPeriodToDB(periodArr, this.periodOption.offset);
            } catch (error) {
                return [];
            }
        },
        default: []
    })
    businessHours: Array<PeriodWithDays>;

    @prop(
        propOptPeriodOption({
            required: [true, "PeriodOption가 설정되지 않았습니다."]
        })
    )
    periodOption: PeriodOption;

    @prop({
        default: []
    })
    infos: Info[];

    @prop({
        default: (): BookingPolicy => {
            return {
                limitFirstBooking: 0,
                limitLastBooking: 60
            };
        }
    })
    bookingPolicy: BookingPolicy;

    async segmentListWithItems(
        this: DocumentType<ProductCls>,
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
    > {
        const query: Stage[] = segmentWithItemsPipeline(
            this,
            dateTimeRange,
            "PERMITTED"
        );
        const productSegmentList: {
            _id: number; // * 1000 하면 segment.from 이랑 같아짐
            items: ItemProps[];
            segment: Segment;
            count: number;
            maxCount: number;
            soldOut: boolean;
        }[] = await ItemModel.aggregate(query);
        return productSegmentList;
    }

    /**
     * dateTimeRange 를 segment로 나누어 배열로 출력함.
     * items가 없는 segment도 포함하여 출력
     */
    async getSegmentSchedules(
        this: DocumentType<ProductCls>,
        dateTimeRange: DateTimeRangeCls,
        soldOut?: boolean
    ): Promise<
        {
            itemCount: number;
            segment: Segment;
            maxCount: number;
            soldOut: boolean;
            items: ObjectId[];
        }[]
    > {
        const unit = this.periodOption.unit;
        const productSegmentList = await this.segmentListWithItems(
            dateTimeRange,
            unit
        );
        const segmentList = divideDateTimeRange(dateTimeRange, unit);

        const real = segmentList.map(segment => {
            return {
                itemCount: 0,
                segment,
                maxCount: this.capacity,
                soldOut: false,
                items: [] as ObjectId[]
            };
        });
        console.log(
            "Product.ts => getSegmentSchedules=============================================="
        );
        real.forEach(o => {
            const filtered = productSegmentList.filter(
                i => i._id * 1000 === o.segment.from.getTime()
            );
            const item = filtered[0];
            console.log({
                filteredItem: item
            });
            if (item) {
                o.itemCount = item.count;
                o.items.push(...item.items.map(i => i._id));
                o.soldOut = this.capacity <= item.count;
            }
        });
        if (soldOut !== undefined || soldOut === null) {
            // soldOut false, true 둘중 하나 출력
            return real.filter(r => r.soldOut === soldOut);
        }
        return real;
    }

    /**
     * 해당 기간에 어떤 Item들이 들어있는지... paging 안되어있음.
     * @param dateTimeRange 날짜 범위 ㄱㄱ
     */
    async getItems(
        this: DocumentType<ProductCls>,
        date: Date,
        status?: ItemStatus
    ): Promise<Array<DocumentType<ItemCls>>> {
        date.setUTCHours(0, 0, 0, 0);
        const dateTimeRange = getDateTimeRangeFromPeriodList(
            this.businessHours,
            date,
            this.periodOption.offset
        );
        if (!dateTimeRange) {
            throw new ApolloError(
                "포함되지 않는 날짜입니다.",
                ERROR_CODES.UNAVAILABLE_QUERY_DATE
            );
        }
        const { from, to } = dateTimeRange;
        const interval = Math.floor(
            (from.getTime() - to.getTime()) / ONE_MINUTE
        );
        const { unit } = this.periodOption;
        if (interval % unit !== 0) {
            throw new ApolloError(
                "dateTimeRange 값이 잘못되었습니다. (unit Error)",
                ERROR_CODES.DATETIMERANGE_UNIT_ERROR,
                {
                    from,
                    to,
                    interval
                }
            );
        }
        const items = await ItemModel.find(
            removeUndefined({
                productId: this._id,
                "dateTimeRange.from": {
                    $lte: to
                },
                "dateTimeRange.to": {
                    $gt: from
                },
                status,
                expiresAt: {
                    $exists: false
                }
            })
        );
        return items;
    }

    async getSchedulesByDate(
        this: DocumentType<ProductCls>,
        date: Date,
        soldOut?: boolean
    ): Promise<ProductSchedules | null> {
        console.log("getSchedulesByDate ===================================");
        const unit = this.periodOption.unit;
        date.setUTCHours(0, 0, 0, 0);
        const dateTimeRange = getDateTimeRangeFromPeriodList(
            this.businessHours,
            date,
            this.periodOption.offset
        );
        if (!dateTimeRange) {
            return {
                info: {
                    isOpenDate: false,
                    dateTimeRange: new DateTimeRangeCls({
                        from: date,
                        to: date
                    }),
                    unit
                },
                list: []
            };
        }
        const itemExistsList = await this.getSegmentSchedules(
            dateTimeRange,
            soldOut
        );
        const list = await Promise.all(
            itemExistsList.map(async o => {
                return {
                    ...o,
                    items: ((await ItemModel.find({
                        _id: { $in: o.items },
                        expiresAt: {
                            $exists: false
                        }
                    })) as unknown) as Item[]
                };
            })
        );
        return {
            info: {
                dateTimeRange,
                unit,
                isOpenDate: true
            },
            list
        };
    }
}

export const ProductModel = getModelForClass(ProductCls);
