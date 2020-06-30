import { compare, hash } from "bcryptjs";
import {
    getModelForClass,
    modelOptions,
    prop,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { Zoneinfo } from "../types/graph";
import { ObjectId } from "mongodb";
import { getCountryInfo } from "../utils/utils";
import { StoreCls } from "./Store/Store";

const BCRYPT_ROUNDS = 10;

@modelOptions(createSchemaOptions(getCollectionName(ModelName.STORE_USER)))
export class StoreUserCls extends BaseSchema {
    @prop()
    name: string;

    @prop()
    password?: string;

    @prop()
    email: string;

    @prop()
    zoneinfo: Zoneinfo;

    @prop()
    phoneNumber: string;

    @prop({ required: true })
    storeId: ObjectId;

    @prop({ required: true })
    storeCode: string;

    @prop({ required: true, default: () => false })
    verifiedPhoneNumber: boolean;

    @prop({ required: true, defualt: () => false })
    verifiedEmail: boolean;

    @prop()
    buyerSub?: string;

    // 전화번호 변경시에도 이 함수 사용.
    setPhoneNumber(
        this: DocumentType<StoreUserCls>,
        phoneNumner: string
    ): DocumentType<StoreUserCls> {
        if (phoneNumner !== this.phoneNumber) {
            this.phoneNumber = phoneNumner;
            this.verifiedPhoneNumber = false;
        }
        return this;
    }

    // email "변경"시에도 사용함.
    setEmail(
        this: DocumentType<StoreUserCls>,
        email: string
    ): DocumentType<StoreUserCls> {
        if (email !== this.email) {
            this.email = email;
            this.verifiedEmail = false;
        }
        return this;
    }

    async setZoneinfo(
        this: DocumentType<StoreUserCls>,
        timezone: string
    ): Promise<DocumentType<StoreUserCls>> {
        try {
            const zoneinfo = await getCountryInfo(timezone);
            this.zoneinfo = zoneinfo;
            return this;
        } catch (error) {
            return this;
        }
    }

    setStoreCode(
        this: DocumentType<StoreUserCls>,
        store: DocumentType<StoreCls>
    ): DocumentType<StoreUserCls> {
        this.storeId = store._id;
        this.storeCode = store.code;
        return this;
    }

    public async comparePassword(
        this: DocumentType<StoreUserCls>,
        password: string
    ): Promise<boolean> {
        if (this.password) {
            return await compare(password, this.password || "");
        } else {
            throw new Error("Password is not exist!");
        }
    }

    public async hashPassword(this: DocumentType<StoreUserCls>): Promise<void> {
        if (this.password) {
            this.password = await hash(this.password, BCRYPT_ROUNDS);
        }
    }
}

export const StoreUserModel = getModelForClass(StoreUserCls);
