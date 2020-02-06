import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { PeriodCls } from "../utils/Period";
import { GenderOption, SelectablePeriod } from "../types/graph";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ITEM)))
export class ItemCls extends BaseSchema {
    @prop()
    name: string;

    @prop()
    storeId: ObjectId;

    @prop()
    itemCode: string;

    @prop()
    images: string[];

    @prop()
    description: string;

    @prop({ default: () => true })
    needToConfirm: boolean;

    @prop({ default: (): GenderOption => "ANY" })
    genderOption: GenderOption;

    /*
     * =============================================================================================================================
     *
     * Optional Fields
     *
     * =============================================================================================================================
     */
    @prop({ default: () => [] })
    enabledPeriod: Array<PeriodCls>;

    @prop({ default: () => [] })
    disabledPeriod: Array<PeriodCls>;

    @prop({
        default: () => 1,
        validate: [
            {
                validator: (v: number) => v >= 0,
                message: "peopleCount는 음수가 될 수 없습니다."
            }
        ]
    })
    peopleCapacity: number;

    @prop({
        validate: [
            {
                validator: (v: SelectablePeriod) => v.max > 0,
                message:
                    "selectablePeriod.max 값은 0또는 음수가 될 수 없습니다."
            },
            {
                validator: (v: SelectablePeriod) => v.min >= 0,
                message: "selectablePeriod.min 값은 음수가 될 수 없습니다."
            },
            {
                validator: (v: SelectablePeriod) => v.unit >= 0,
                message: "selectablePeriod.unit 값은 음수가 될 수 없습니다."
            }
        ]
    })
    selectablePeriod: SelectablePeriod;
}

export const ItemModel = getModelForClass(ItemCls);
