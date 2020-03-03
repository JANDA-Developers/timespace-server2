import { ObjectId } from "mongodb";
import { createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { Zoneinfo } from "../types/graph";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../types/values";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ZONE_INFO)))
export class CountryInfo {
    static getZoneinfo = async (timezone: String): Promise<Zoneinfo> => {
        const countryInfo = await CountryInfoModel.findOne({
            "timezones.name": timezone
        });
        if (!countryInfo) {
            throw new ApolloError(
                "Timezone 설정이 잘못되었습니다.",
                ERROR_CODES.UNDEFINED_COUNTRYINFO,
                {
                    timezone
                }
            );
        }
        const tz = countryInfo.timezones.find(tz => tz.name === timezone);
        if (!tz) {
            throw new ApolloError(
                `Timezone is falcy value ${tz}`,
                ERROR_CODES.FALCY_TIMEZONE
            );
        }
        const zoneinfo = {
            name: countryInfo.countryName,
            tz: tz.name,
            code: countryInfo.countryCode,
            offset: tz.offset,
            callingCode: countryInfo.callingCode
        };
        return zoneinfo;
    };

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
