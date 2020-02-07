import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.STORE)))
export class StoreCls extends BaseSchema {
    @prop()
    user: ObjectId;

    @prop()
    name: string;

    @prop()
    type: "CONFERENCEROOM_BOOKING" | "TICKETS";

    @prop()
    storeCode: string;

    @prop()
    items: ObjectId[];
}

export const StoreModel = getModelForClass(StoreCls);
