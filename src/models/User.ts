import {
    getModelForClass,
    modelOptions,
    prop,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { ApolloError } from "apollo-server";
import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { Zoneinfo, UserRole } from "GraphType";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ERROR_CODES } from "../types/values";
import { ONE_DAY } from "../utils/dateFuncs";
import { ClientSession } from "mongoose";
import { StoreModel } from "./Store/Store";
import { ItemModel } from "./Item/Item";
import { ProductModel } from "./Product/Product";
import { StoreGroupModel } from "./StoreGroup";
import { ItemStatusChangedHistoryModel } from "./ItemStatusChangedHistory/ItemStatusChanged";
import { AttributeType } from "aws-sdk/clients/cognitoidentityserviceprovider";

export type LoggedInInfo = {
    idToken: string;
    accessToken: string;
    expiryDate: number;
    ip: string;
    os: string;
};

@modelOptions(createSchemaOptions(getCollectionName(ModelName.USER)))
export class UserCls extends BaseSchema {
    static findBySub = async (sub: string): Promise<DocumentType<UserCls>> => {
        const user = await UserModel.findOne({
            sub
        });
        if (!user) {
            throw new ApolloError(
                "존재하지 않는 UserSub입니다",
                ERROR_CODES.INVALID_USER_SUB,
                { userSub: sub }
            );
        }
        await user.setAttributesFromCognito();
        return user;
    };

    static findUser = async (
        cognitoUser: any
    ): Promise<DocumentType<UserCls>> => {
        const user = await UserModel.findOne({
            sub: cognitoUser.sub
        });
        if (!user) {
            throw new ApolloError(
                "존재하지 않는 UserSub입니다",
                ERROR_CODES.INVALID_USER_SUB,
                { user: cognitoUser }
            );
        }
        await user.setAttributesFromCognito(cognitoUser);
        return user;
    };

    async setAttributesFromCognito(
        this: DocumentType<UserCls>,
        user?: any
    ): Promise<void> {
        let cognitoUser = user;
        if (!cognitoUser) {
            const cognito = new CognitoIdentityServiceProvider();
            cognitoUser = await cognito
                .adminGetUser({
                    UserPoolId: process.env.COGNITO_POOL_ID || "",
                    Username: this.sub
                })
                .promise();
            const attributes = cognitoUser.UserAttributes;
            if (attributes) {
                attributes.forEach(attr => {
                    const { Name, Value } = attr;
                    if (Name === "zoneinfo") {
                        this.zoneinfo = JSON.parse(Value || "");
                    } else if (Value) {
                        if (Value === "true" || Value === "false") {
                            this[Name] = Value === "true";
                        } else {
                            this[Name] = Value;
                        }
                    }
                });
            }
        } else {
            for (const key in cognitoUser) {
                const value = cognitoUser[key];
                if (value !== undefined) {
                    this[key] = value;
                }
            }
        }
    }

    @prop()
    email: string;

    phone_number: string;
    email_verified: boolean;
    phone_number_verified: boolean;
    name: string;
    exp: number;

    @prop()
    smsKey?: string;

    @prop({ default: [] })
    roles: UserRole[];

    @prop()
    sub: string;

    @prop()
    refreshToken: string;

    @prop()
    confirmationCode: string;

    @prop()
    refreshTokenLastUpdate: Date;

    @prop()
    zoneinfo: Zoneinfo;

    @prop()
    loginInfos: LoggedInInfo[];

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id))
    })
    stores: ObjectId[];

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id))
    })
    disabledStores: ObjectId[];

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id))
    })
    groupIds: ObjectId[];

    async deleteUser(
        this: DocumentType<UserCls>,
        session: ClientSession,
        expiresAt: Date = new Date(new Date().getTime() + 7 * ONE_DAY)
    ) {
        const cognito = new CognitoIdentityServiceProvider();
        const result = await cognito
            .adminDeleteUser({
                UserPoolId: process.env.COGNITO_POOL_ID || "",
                Username: this.sub
            })
            .promise();
        if (result.$response.error) {
            throw result.$response.error;
        }
        const expireQuery = { $set: { expiresAt } };
        const userId = this._id;
        await StoreModel.updateMany(
            {
                userId
            },
            expireQuery,
            {
                session
            }
        );
        await ProductModel.updateMany(
            {
                userId
            },
            expireQuery,
            {
                session
            }
        );
        await ItemModel.updateMany(
            {
                buyerId: this._id
            },
            expireQuery,
            { session }
        );
        await StoreGroupModel.updateMany(
            {
                userId
            },
            expireQuery,
            {
                session
            }
        );
        await ItemStatusChangedHistoryModel.updateMany(
            {
                workerId: this._id
            },
            expireQuery,
            {
                session
            }
        );
        this.expiresAt = expiresAt;
    }

    async updateUser(
        this: DocumentType<UserCls>,
        attributes: AttributeType[]
    ): Promise<boolean> {
        const cognito = new CognitoIdentityServiceProvider();
        const cognitoUpdateResult = await cognito
            .adminUpdateUserAttributes({
                UserAttributes: attributes,
                UserPoolId: process.env.COGNITO_POOL_ID || "",
                Username: this.sub
            })
            .promise();
        if (cognitoUpdateResult.$response.error) {
            throw cognitoUpdateResult.$response.error;
        }
        return true;
    }
}

export const UserModel = getModelForClass(UserCls);
