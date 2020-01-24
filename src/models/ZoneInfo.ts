import { ObjectId } from "mongodb";

import { createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { Stage } from "../types/pipeline";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.ZONE_INFO)))
export class ZoneInfo {
    static getGroupedTimezone = async (countryName?: string): Promise<any> => {
        const pipeline: Stage[] = [];
        if (countryName) {
            pipeline.push({
                $match: {
                    countryName
                }
            });
        }
        pipeline.push({
            $group: {
                _id: {
                    countryCode: "$countryCode",
                    countryName: "$countryName",
                    offset: "$offset"
                },
                timezones: {
                    $push: "$timezone"
                }
            }
        });
        const data = await ZoneInfoModel.aggregate(pipeline);
        return data;
    };

    static countries = async (): Promise<{ code: string; name: string }[]> => {
        // const regex = new RegExp(name, "i");
        const pipeline: Stage[] = [
            {
                $group: {
                    _id: { code: "$countryCode", name: "$countryName" }
                }
            }
        ];
        const data: {
            _id: { code: string; name: string };
        }[] = await ZoneInfoModel.aggregate(pipeline);
        return data.map(v => v._id);
    };

    @prop()
    _id: ObjectId;

    @prop()
    countryName: string;

    @prop()
    countryCode: string;

    @prop()
    timezone: string;

    @prop()
    offsetMinute: number;
}

export const ZoneInfoModel = getModelForClass(ZoneInfo);
