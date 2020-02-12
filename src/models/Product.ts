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
import { GenderOption, PeriodOption, Period } from "../types/graph";
import { genCode, s4 } from "./utils/genId";
import { ApolloError } from "apollo-server";

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

    @prop()
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
                message: "PeopleCount는 음수가 될 수 없습니다."
            }
        ],
        required: [
            function(this: DocumentType<ProductCls>) {
                return this.usingCapacityOption;
            },
            "PeopleCapacity가 설정되지 않았습니다. "
        ]
    })
    peopleCapacity: number;

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
                    enabledPeriod: Array<PeriodCls>
                ): boolean {
                    return (
                        enabledPeriod.filter(
                            period => period.time < this.periodOption.min
                        ).length === 0
                    );
                },
                message:
                    "enabledPeriod.time 값이 periodOption.min보다 작습니다."
            }
        ],
        default: () => [],
        required: [
            function(this: DocumentType<ProductCls>) {
                return this.usingPeriodOption;
            },
            "EnabledPeriod가 설정되지 않았습니다."
        ],
        set: (periodList: Array<Period>) =>
            periodList.map(p => new PeriodCls(p)),
        get: (periodList: Array<Period>) =>
            periodList.map(p => new PeriodCls(p))
    })
    enabledPeriod: Array<PeriodCls>;

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
        ],
        required: [
            function(this: DocumentType<ProductCls>) {
                return this.usingPeriodOption;
            },
            "PeriodOption가 설정되지 않았습니다."
        ]
    })
    periodOption: PeriodOption;

    @prop()
    intro: string;

    @prop()
    warning: string;
}

export const ProductModel = getModelForClass(ProductCls);
