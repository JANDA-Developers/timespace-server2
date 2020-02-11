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
import { Zoneinfo, UserRole } from "../types/graph";
import { CognitoIdentityServiceProvider } from "aws-sdk";

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
                "INVALID_USER_SUB",
                { userSub: sub }
            );
        }
        return user;
    };

    async setAttributesFronCognito(this: DocumentType<UserCls>): Promise<void> {
        const cognito = new CognitoIdentityServiceProvider();
        const cognitoUser = await cognito
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
                } else {
                    this[Name] = Value;
                }
            });
        }
    }

    @prop()
    _id: ObjectId;

    @prop({ default: [] })
    roles: UserRole[];

    @prop()
    sub: string;

    @prop()
    refreshToken: string;

    @prop()
    refreshTokenLastUpdate: Date;

    // Zoneinfo from graph.d.ts
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
}

export const UserModel = getModelForClass(UserCls);
