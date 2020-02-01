import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { User } from "../types/graph";
import { ObjectId } from "mongodb";

export type LoggedInInfo = {
    refreshToken: string;
    idToken: string;
    expiryDate: number;
    ip: string;
    os: string;
};

@modelOptions(createSchemaOptions(getCollectionName(ModelName.USER)))
export class UserCls extends BaseSchema {
    @prop()
    _id: ObjectId;

    @prop()
    email: string;

    @prop()
    tokens: LoggedInInfo[];
}

export const migrateCognitoUser = (user: any): User => {
    return {
        _id: user.sub,
        name: user.name,
        email: user.email,
        tokenExpiry: user.exp,
        ...user
    };
};

export const UserModel = getModelForClass(UserCls);
