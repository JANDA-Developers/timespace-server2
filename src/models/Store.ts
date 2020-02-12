import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { ApolloError } from "apollo-server";
import { genCode } from "./utils/genId";
import { Zoneinfo, StoreType, Manager, Location, Period } from "../types/graph";
import { ERROR_CODES } from "../types/values";
import { PeriodCls } from "../utils/Period";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.STORE)))
export class StoreCls extends BaseSchema {
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

    @prop({ default: true })
    usingPeriodOption: boolean;

    @prop({
        default: true
    })
    usingCapacityOption: boolean;

    @prop()
    manager: Manager;

    @prop()
    location: Location;

    @prop({
        default: (): Array<PeriodCls> => [
            // 월~금: 09:00 ~ 21:00
            new PeriodCls({ start: 540, time: 720, days: 62 })
        ],
        set: (periodArr: Array<Period>) =>
            periodArr.map(period => new PeriodCls(period)),
        get: (periodArr: Array<Period>) =>
            periodArr.map(period => new PeriodCls(period))
    })
    businessHours: Array<PeriodCls>;
}

export const StoreModel = getModelForClass(StoreCls);
