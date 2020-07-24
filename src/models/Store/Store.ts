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
    CustomFieldDefineInput,
    Info,
    StoreUserSignUpOption
} from "GraphType";
import { ERROR_CODES } from "../../types/values";
import { PeriodCls } from "../../utils/Period";
import {
    setPeriodToDB,
    getPeriodFromDB,
    validatePeriod
} from "../../utils/periodFuncs";
import { BookingPolicy } from "GraphType";
import { PeriodWithDays } from "../../utils/PeriodWithDays";
import _ from "lodash";
import { StoreProps, StoreFuncs } from "./Store.interface";
import {
    propOptPeriodOption,
    propOptIdOption,
    propOptIdsOption
} from "../_propValidateOptions/propOptions";
import { CustomFieldCls } from "../../types/types";

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

    @prop(
        propOptIdOption({
            required: true,
            validate: {
                validator: user => user,
                message: "Store.user 정보가 존재하지 않습니다."
            }
        })
    )
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
            },
            {
                validator(
                    this: DocumentType<StoreCls>,
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
                    this: DocumentType<StoreCls>,
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
        default: []
    })
    businessHours: Array<PeriodWithDays>;

    @prop(propOptPeriodOption())
    periodOption: PeriodOption;

    @prop(propOptIdsOption({ defualt: [] }))
    groupIds: ObjectId[];

    @prop({
        get: (id: any) => new ObjectId(id),
        set: (id: any) => new ObjectId(id)
    })
    groupId: ObjectId;

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
                    ...c,
                    isMandatory: c.isMandatory || false
                };
            });
        },
        get(this: DocumentType<StoreCls>, cf: CustomField[]) {
            return cf.map(cf1 => {
                return {
                    ...cf1,
                    key: new ObjectId(cf1.key),
                    isMandatory: cf1.isMandatory || false
                };
            });
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
    customFields: CustomFieldCls[];

    @prop({
        default: (): BookingPolicy => {
            return {
                limitFirstBooking: 0,
                limitLastBooking: 60
            };
        }
    })
    bookingPolicy: BookingPolicy;

    @prop({
        default: []
    })
    infos: Info[];

    @prop({
        default: {
            acceptAnonymousUser: false,
            userAccessRange: "STORE_GROUP",
            useSignUpAutoPermit: false,
            useEmailVerification: false,
            usePhoneVerification: true
        } as Partial<StoreUserSignUpOption>
    })
    signUpOption: StoreUserSignUpOption;
}

export const StoreModel = getModelForClass(StoreCls);
