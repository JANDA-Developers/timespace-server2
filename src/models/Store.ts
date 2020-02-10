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
import { Zoneinfo, StoreType, Manager } from "../types/graph";

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
                "UNEXIST_STORECODE"
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
    user: ObjectId;

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
    description: string;

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id))
    })
    items: ObjectId[];

    @prop({ default: true })
    usingPeriodOption: boolean;

    @prop({
        default: true
    })
    usingCapacityOption: boolean;

    @prop()
    manager: Manager;
}

export const StoreModel = getModelForClass(StoreCls);
