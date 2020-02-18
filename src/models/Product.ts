import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { PeriodCls } from "../utils/Period";
import {
    GenderOption,
    PeriodOption,
    ProductSchedules,
    Segment,
    Item
} from "../types/graph";
import { genCode, s4 } from "./utils/genId";
import { ApolloError } from "apollo-server";
import {
    getPeriodFromDB,
    setPeriodToDB,
    extractPeriodFromDate,
    divideDateTimeRange
} from "../utils/periodFuncs";
import { PeriodWithDays } from "../utils/PeriodWithDays";
import { ItemCls, ItemModel, ItemProps } from "./Item";
import { ERROR_CODES } from "../types/values";
import { ONE_MINUTE, removeHours } from "../utils/dateFuncs";
import { DateTimeRangeCls } from "../utils/DateTimeRange";
import { Stage } from "../types/pipeline";
import _ from "lodash";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.PRODUCT)))
export class ProductCls extends BaseSchema {
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
    usingPeriodOption: boolean;

    @prop({ default: () => false })
    usingCapacityOption: boolean;

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
        required: [
            function(this: DocumentType<ProductCls>) {
                return this.usingCapacityOption;
            },
            "Capacity가 설정되지 않았습니다. "
        ]
    })
    capacity: number;

    @prop({
        validate: [
            {
                validator(this: DocumentType<ProductCls>, value) {
                    return this.usingCapacityOption ? value : true;
                },
                message: "GenderOption이 설정되지 않았습니다. "
            }
        ],
        default(this: DocumentType<ProductCls>) {
            return this.usingCapacityOption ? "ANY" : undefined;
        }
    })
    genderOption: GenderOption;

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
        required: [
            function(this: DocumentType<ProductCls>) {
                return this.usingPeriodOption;
            },
            "BusinessHours가 설정되지 않았습니다."
        ],
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

    @prop({
        validate: [
            {
                validator: (v: PeriodOption) => v.max > 0,
                message: "PeriodOption.max 값은 0또는 음수가 될 수 없습니다."
            },
            {
                validator: (v: PeriodOption) => v.min >= 0,
                message: "PeriodOption.min 값은 음수가 될 수 없습니다."
            },
            {
                validator: (v: PeriodOption) => v.max % v.unit === 0,
                message: "PeriodOption.max 값이 unit 의 배수가 아닙니다."
            },
            {
                validator: (v: PeriodOption) => v.min % v.unit === 0,
                message: "PeriodOption.min 값이 unit 의 배수가 아닙니다."
            },
            {
                validator: (v: PeriodOption) => v.unit >= 0,
                message: "PeriodOption.unit 값은 음수가 될 수 없습니다."
            }
        ],
        required: [
            function(this: DocumentType<ProductCls>) {
                return this.usingPeriodOption;
            },
            "PeriodOption가 설정되지 않았습니다."
        ]
    })
    periodOption: PeriodOption;

    async getSegmentSchedules(
        this: DocumentType<ProductCls>,
        dateTimeRange: DateTimeRangeCls,
        unit: number
    ): Promise<
        {
            itemCount: number;
            segment: Segment;
            maxCount: number;
            soldOut: boolean;
            items: ObjectId[];
        }[]
    > {
        const unitSeconds = unit * 60;
        const query: Stage[] = [
            {
                $match: {
                    productId: this._id,
                    "dateTimeRange.from": {
                        $lt: dateTimeRange.to
                    },
                    "dateTimeRange.to": {
                        $gt: dateTimeRange.from
                    }
                }
            },
            {
                $addFields: {
                    segments: {
                        $range: [
                            {
                                $divide: [
                                    {
                                        $toLong: "$dateTimeRange.from"
                                    },
                                    1000
                                ]
                            },
                            {
                                $divide: [
                                    {
                                        $toLong: "$dateTimeRange.to"
                                    },
                                    1000
                                ]
                            },
                            // unit
                            unitSeconds
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$segments",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            {
                                _id: "$segments"
                            },
                            {
                                item: {
                                    _id: "$_id",
                                    name: "$name",
                                    dateTimeRange: "$dateTimeRange",
                                    productId: "$productId",
                                    storeId: "$storeId",
                                    buyerId: "$buyerId",
                                    code: "$code",
                                    createdAt: "$createdAt",
                                    updatedAt: "$updatedAt"
                                }
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    items: {
                        $addToSet: "$item"
                    }
                }
            },
            {
                $addFields: {
                    segment: {
                        from: {
                            $toDate: {
                                $multiply: ["$_id", 1000]
                            }
                        },
                        to: {
                            $toDate: {
                                $multiply: [
                                    { $add: ["$_id", unitSeconds] },
                                    1000
                                ]
                            }
                        }
                    },
                    count: {
                        $size: "$items"
                    }
                }
            },
            {
                $sort: {
                    "segment.from": 1
                }
            }
        ];
        const productSegmentList: {
            _id: number;
            items: ItemProps[];
            segment: Segment;
            count: number;
        }[] = await ItemModel.aggregate(query);
        // const result = productSegmentList.map(o => {
        //     return {
        //         itemCount: o.count,
        //         segment: o.segment,
        //         maxCount: this.capacity,
        //         soldOut: o.count >= this.capacity,
        //         items: o.items.map(item => item._id)
        //     };
        // });
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
        real.forEach(o => {
            const filtered = productSegmentList.filter(
                i => i._id * 1000 === o.segment.from.getTime()
            );
            const item = filtered[0];
            if (item) {
                o.itemCount = item.count;
                o.items.push(...item.items.map(i => i._id));
                o.soldOut = this.capacity <= item.count;
            }
        });
        return real;
    }

    /**
     * 해당 기간에 어떤 Item들이 들어있는지... paging 안되어있음.
     * @param dateTimeRange 날짜 범위 ㄱㄱ
     */
    async getItems(
        this: DocumentType<ProductCls>,
        date: Date
    ): Promise<Array<DocumentType<ItemCls>>> {
        // TODO: 스케줄 어떻게 구할까?
        // Date로 부터 from, to를 구한다.
        // 하루 중 최소값의 Date, 최대값의 Date를 구해야함.
        const offsetMinutes = this.periodOption.offset * 60;
        const mDate = new Date(date.getTime() - offsetMinutes * 60000);
        let st: number = 1440 - offsetMinutes;
        let ed: number = 0 - offsetMinutes;
        const cDay = 1 << mDate.getDay();
        this.businessHours.forEach(({ days, start, end, time }) => {
            // days를 비교하여 포함되어있는지 확인 ㄱㄱ
            const isIncludeInDays = (days & cDay) === cDay;
            if (isIncludeInDays) {
                // 포함하고 있으면 뭐 어떻게 해야함?
                if (start < st) {
                    // start = -60
                    st = start;
                }
                if (ed < end) {
                    // end = 720
                    ed = end;
                }
            }
        });
        const cDateWithoutHours = removeHours(date).getTime();
        const from = new Date(cDateWithoutHours + st * ONE_MINUTE);
        const to = new Date(cDateWithoutHours + ed * ONE_MINUTE);
        // TODO: 해야됨 ㅎ
        const interval = Math.floor(
            (from.getTime() - to.getTime()) / ONE_MINUTE
        );
        const { unit } = this.periodOption;
        if (interval % unit !== 0) {
            throw new ApolloError(
                "dateTimeRange 값이 잘못되었습니다. (unit Error)",
                ERROR_CODES.DATETIMERANGE_UNIT_ERROR,
                {
                    interval
                }
            );
        }
        const items = await ItemModel.find({
            productId: this._id,
            "dateTimeRange.from": {
                $lte: to
            },
            "dateTimeRange.to": {
                $gt: from
            },
            expiresAt: {
                $exists: false
            }
        });
        return items;
    }

    async getSchedulesByDate(
        this: DocumentType<ProductCls>,
        date: Date
    ): Promise<ProductSchedules> {
        const { from, to, timeMillis } = extractPeriodFromDate(
            this.businessHours,
            date
        );
        const unit = this.periodOption.unit;
        /*
         * ==================================================================================
         * 본격적인 로직 시작
         * ==================================================================================
         */
        const dateTimeRange = new DateTimeRangeCls({
            from,
            to
        });
        // Segment 어떻게 구할까... 모든 Segment를 줘야할듯 하지? 끄아앙 ㅜㅜ
        // TODO: 1. 모든 Segment를 구함.
        // TODO: 2. 그런 다음에 Segment에 Item을 대입한다.

        // const segmentList: Segment[] = divideDateTimeRange(dateTimeRange, unit);
        // console.log("Segment List=========================================");
        // console.log(segmentList);
        console.log({ timeMillis });
        // TODO: ItemModel.aggregation ㄱㄱㄱ
        const list = await this.getSegmentSchedules(
            dateTimeRange,
            this.periodOption.unit
        );

        console.log("list ============================================");
        console.log(list);

        const schedules = await Promise.all(
            list.map(async o => {
                return {
                    ...o,
                    items: ((await ItemModel.find({
                        _id: { $in: o.items }
                    })) as unknown) as Item[]
                };
            })
        );

        return {
            info: {
                dateTimeRange,
                unit
            },
            schedules
        };
    }

    // async periodsCapacityByDate(
    //     this: DocumentType<ProductCls>,
    //     dateTimeRangeCls: DateTimeRangeCls
    // ) {
    //     const { from, to } = dateTimeRangeCls;
    //     const unit = this.periodOption.unit;
    //     if ((dateToMinutes(from) % unit) + (dateToMinutes(to) % unit) !== 0) {
    //         throw new ApolloError(
    //             "from, to 값이 Unit의 배수가 아닙니다.",
    //             "UNIT_ERROR_FROM_TO"
    //         );
    //     }
    //     // const items = await this.getItems(dateTimeRangeCls);
    //     // console.log(items);

    //     // TODO: 리턴값 인터페이스 작성하기 ㄱㄱ
    //     // Unit 문제: 입력되는 시간의 단위를 Unit으로 나누었을때 0가 나와야함. validation 렛츠고

    //     return [];
    // }
}

export const ProductModel = getModelForClass(ProductCls);
