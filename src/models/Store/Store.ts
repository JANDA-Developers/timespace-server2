import { BaseSchema, createSchemaOptions } from "../../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "../__collectionNames";
import { ObjectId } from "mongodb";
import { ApolloError } from "apollo-server";
import { genCode } from "../utils/genId";
import {
    Zoneinfo,
    StoreType,
    Manager,
    Location,
    PeriodOption,
    CustomField,
    CustomFieldDefineInput
} from "GraphType";
import { ERROR_CODES } from "../../types/values";
import { PeriodCls } from "../../utils/Period";
import {
    setPeriodToDB,
    getPeriodFromDB,
    validatePeriod
} from "../../utils/periodFuncs";
import { PeriodWithDays } from "../../utils/PeriodWithDays";
import _ from "lodash";
import { StoreProps, StoreFuncs } from "./Store.interface";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.STORE)))
export class StoreCls extends BaseSchema implements StoreProps, StoreFuncs {
    static findByCode = async (
        storeCode: string
    ): Promise<DocumentType<StoreCls>> => {
        const store = await StoreModel.findOne({
            code: storeCode
        });
        if (!store) {
            throw new ApolloError(
                "존재하지 않는 StoreCode입니다",
                ERROR_CODES.UNEXIST_STORE
            );
        }
        if (store.expiresAt) {
            throw new ApolloError(
                "존재하지 않는 Store 입니다.(삭제됨)",
                ERROR_CODES.UNEXIST_STORE
            );
        }
        return store;
    };

    @prop({
        required: true,
        validate: {
            validator: user => user,
            message: "Store.user 정보가 존재하지 않습니다."
        },
        get: id => new ObjectId(id),
        set: id => new ObjectId(id)
    })
    userId: ObjectId;

    @prop({
        required: true,
        set: (zoneinfo: any) => {
            if (typeof zoneinfo === "string") {
                return JSON.parse(zoneinfo);
            }
            return zoneinfo;
        },
        get: (zoneinfo: any) => zoneinfo
    })
    zoneinfo: Zoneinfo;

    @prop({
        required: true,
        validate: {
            validator: name => name,
            message: "상점 이름이 존재하지 않습니다."
        }
    })
    name: string;

    @prop()
    type: StoreType;

    @prop({
        default(this: DocumentType<StoreCls>) {
            return genCode(this._id);
        }
    })
    code: string;

    @prop()
    image: string;

    @prop()
    description: string;

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => {
            return ids.map(id =>
                typeof id === "string" ? new ObjectId(id) : id
            );
        }
    })
    products: ObjectId[];

    @prop({
        default(this: DocumentType<StoreCls>) {
            if (this.type === "LEASE") {
                return true;
            }
            return false;
        }
    })
    usingPeriodOption: boolean;

    @prop({
        default(this: DocumentType<StoreCls>) {
            return false;
        }
    })
    usingCapacityOption: boolean;

    @prop()
    manager: Manager;

    @prop()
    location: Location;

    @prop({
        get(
            this: DocumentType<StoreCls>,
            periodArr: Array<PeriodCls>
        ): Array<PeriodWithDays> {
            return getPeriodFromDB(periodArr, this.periodOption.offset);
        },
        set(
            this: DocumentType<StoreCls>,
            periodArr: Array<PeriodWithDays>
        ): Array<PeriodCls> {
            try {
                return setPeriodToDB(periodArr, this.periodOption.offset);
            } catch (error) {
                return [];
            }
        },
        validate: [
            {
                validator(
                    this: DocumentType<StoreCls>,
                    businessHours: Array<PeriodCls>
                ) {
                    console.log("In Validator");
                    console.log(businessHours);
                    return validatePeriod(businessHours);
                },
                message: "Validation Fail"
            }
        ],
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
                validator: (v: PeriodOption) => v.unit >= 0,
                message: "PeriodOption.unit 값은 음수가 될 수 없습니다."
            }
        ]
    })
    periodOption: PeriodOption;

    // getBussinessHoursToString(
    //     this: DocumentType<StoreCls>
    // ): { days: string; hours: string } {
    //     // TODO: 영업시간 String으로 구하기
    //     // 1. 겹치는 부분들 다 취합해서 Array<Period> 구하기
    //     // 2. String으로 출력하기
    //     // 어떻게 겹치는 부분을 구하지?
    //     let result = "";
    //     this.businessHours.forEach(item => {
    //         const { days, start, end } = item;
    //         const daysArr = "";
    //     });
    // }

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id))
    })
    groupIds: ObjectId[];

    @prop()
    warning: string;

    @prop()
    intro: string;

    @prop({
        default: [],
        set(this: DocumentType<StoreCls>, cf: CustomFieldDefineInput[]) {
            return cf.map(c => {
                return {
                    key: new ObjectId(c.key || undefined),
                    ...c
                };
            });
        },
        get(this: DocumentType<StoreCls>, cf: CustomField[]) {
            return cf;
        },
        validate: [
            {
                validator(
                    this: DocumentType<StoreCls>,
                    value: CustomField[]
                ): boolean {
                    console.log({
                        value
                    });
                    let result = true;
                    value.forEach(v => {
                        if (v.type === "LIST" && v.list.length === 0) {
                            result = false;
                        }
                    });
                    return result;
                },
                message:
                    "CustomField Validation Error => type=List but List is empty"
            }
        ]
    })
    customFields: CustomField[];
}

export const StoreModel = getModelForClass(StoreCls);
