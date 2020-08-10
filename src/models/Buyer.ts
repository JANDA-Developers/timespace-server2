import {
    getModelForClass,
    modelOptions,
    prop,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ApolloError } from "apollo-server";
import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { Zoneinfo } from "GraphType";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ERROR_CODES } from "../types/values";
import { ONE_DAY } from "../utils/dateFuncs";
import { ClientSession } from "mongoose";
import { ItemModel } from "./Item/Item";
import { ItemStatusChangedHistoryModel } from "./ItemStatusChangedHistory/ItemStatusChanged";
import { ObjectId } from "mongodb";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.BUYER)))
export class BuyerCls extends BaseSchema {
    static findBySub = async (sub: string): Promise<DocumentType<BuyerCls>> => {
        const buyer = await BuyerModel.findOne({
            sub
        });
        if (!buyer) {
            throw new ApolloError(
                "존재하지 않는 UserSub입니다",
                ERROR_CODES.INVALID_USER_SUB,
                { userSub: sub }
            );
        }
        await buyer.setAttributesFromCognito();
        return buyer;
    };

    static findBuyer = async (
        cognitoBuyer: any
    ): Promise<DocumentType<BuyerCls>> => {
        const buyer = await BuyerModel.findOne({
            sub: cognitoBuyer.sub
        });
        if (!buyer) {
            throw new ApolloError(
                "존재하지 않는 UserSub입니다",
                ERROR_CODES.INVALID_USER_SUB,
                { user: cognitoBuyer }
            );
        }
        await buyer.setAttributesFromCognito(cognitoBuyer);
        return buyer;
    };

    async setAttributesFromCognito(
        this: DocumentType<BuyerCls>,
        user?: any
    ): Promise<void> {
        let cognitoUser = user;
        if (!cognitoUser) {
            const cognito = new CognitoIdentityServiceProvider();
            cognitoUser = await cognito
                .adminGetUser({
                    UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
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
    sub: string;

    @prop()
    refreshToken: string;

    @prop()
    refreshTokenLastUpdate: Date;

    @prop()
    zoneinfo: Zoneinfo;

    @prop()
    itemIds: ObjectId[];

    @prop()
    company: string;

    @prop()
    confirmationCode: string;

    async deleteBuyer(
        this: DocumentType<BuyerCls>,
        session: ClientSession,
        expiresAt: Date = new Date(new Date().getTime() + 7 * ONE_DAY)
    ) {
        const cognito = new CognitoIdentityServiceProvider();
        const result = await cognito
            .adminDeleteUser({
                UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
                Username: this.sub
            })
            .promise();
        if (result.$response.error) {
            throw result.$response.error;
        }
        const expireQuery = { $set: { expiresAt } };
        await ItemModel.updateMany(
            {
                buyerId: this._id
            },
            expireQuery,
            { session }
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
}

export const BuyerModel = getModelForClass(BuyerCls);
