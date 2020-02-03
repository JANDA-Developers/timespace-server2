import { ObjectId } from "mongodb";
import { createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ZONE_INFO)))
export class CountryInfo {
    @prop()
    _id: ObjectId;

    @prop()
    countryName: string;

    @prop()
    countryCode: string;

    @prop()
    callingCode: string;

    @prop()
    timezones: {
        name: string;
        offset: number;
    }[];
}

export const CountryInfoModel = getModelForClass(CountryInfo);
