import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.NOTIFICATION)))
export class NotificationCls extends BaseSchema {
    @prop()
    userId: ObjectId;

    @prop()
    storeId: ObjectId;

    @prop()
    name: string;

    @prop()
    description: string;

    @prop({ default: () => true })
    isNew: boolean;

    @prop()
    url: string;
}

export const NotificationModel = getModelForClass(NotificationCls);
