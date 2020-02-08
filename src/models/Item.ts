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
import { GenderOption, PeriodOption } from "../types/graph";
import { genCode, s4 } from "./utils/genId";
import { ApolloError } from "apollo-server";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ITEM)))
export class ItemCls extends BaseSchema {
    static findByCode = async (
        itemCode: string
    ): Promise<DocumentType<ItemCls>> => {
        const item = await ItemModel.findOne({
            code: itemCode
        });
        if (!item) {
            throw new ApolloError(
                "존재하지 않는 StoreCode입니다",
                "UNEXIST_ITEMCODE"
            );
        }
        return item;
    };

    @prop()
    name: string;

    @prop()
    storeId: ObjectId;

    @prop({
        default(this: DocumentType<ItemCls>) {
            return `${genCode(this.storeId)}-${s4(32).toUpperCase()}`;
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
     * =============================================================================================================================
     *
     * Optional Fields
     *
     * =============================================================================================================================
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
                message: "peopleCount는 음수가 될 수 없습니다."
            }
        ],
        required: [
            function(this: DocumentType<ItemCls>) {
                return this.usingCapacityOption;
            },
            "PeopleCapacity가 설정되지 않았습니다. "
        ]
    })
    peopleCapacity: number;

    @prop({
        validate: [
            {
                validator(this: DocumentType<ItemCls>, value) {
                    return this.usingCapacityOption ? value : true;
                },
                message: "GenderOption이 설정되지 않았습니다. "
            }
        ],
        default(this: DocumentType<ItemCls>) {
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
        default: () => [],
        required: [
            function(this: DocumentType<ItemCls>) {
                return this.usingPeriodOption;
            },
            "SelectablePeriod가 설정되지 않았습니다."
        ]
    })
    enabledPeriod: Array<PeriodCls>;

    @prop({
        default: () => [],
        required: [
            function(this: DocumentType<ItemCls>) {
                return this.usingPeriodOption;
            },
            "DisablePeriod가 설정되지 않았습니다."
        ]
    })
    disabledPeriod: Array<PeriodCls>;

    @prop({
        validate: [
            {
                validator: (v: PeriodOption) => v.max > 0,
                message:
                    "selectablePeriod.max 값은 0또는 음수가 될 수 없습니다."
            },
            {
                validator: (v: PeriodOption) => v.min >= 0,
                message: "selectablePeriod.min 값은 음수가 될 수 없습니다."
            },
            {
                validator: (v: PeriodOption) => v.unit >= 0,
                message: "selectablePeriod.unit 값은 음수가 될 수 없습니다."
            }
        ],
        required: [
            function(this: DocumentType<ItemCls>) {
                return this.usingPeriodOption;
            },
            "SelectablePeriod가 설정되지 않았습니다."
        ]
    })
    selectablePeriod: PeriodOption;
}

export const ItemModel = getModelForClass(ItemCls);
