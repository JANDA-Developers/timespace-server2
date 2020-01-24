import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ZoneInfo } from "../types/graph";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.USER)))
export class UserCls extends BaseSchema {
    name: string;

    email: string;

    zoneInfo: ZoneInfo;

    phoneNumber: string;
}

export const UserModel = getModelForClass(UserCls);
