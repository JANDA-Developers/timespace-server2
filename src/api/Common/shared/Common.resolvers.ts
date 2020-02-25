/* eslint-disable @typescript-eslint/camelcase */
import { CountryInfoModel } from "../../../models/CountryInfo";
import { getGeoInfoByIP } from "../../../utils/geoLocationAPI";
import { getIP } from "../../../utils/utils";
import { Zoneinfo, PeriodInput, CustomField } from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { PeriodCls } from "../../../utils/Period";
import { genCode } from "../../../models/utils/genId";
import { ObjectId } from "mongodb";
import {
    splitPeriods,
    mergePeriods,
    daysNumToArr
} from "../../../utils/periodFuncs";
import { DayEnum } from "../../../types/values";
import { ONE_MINUTE } from "../../../utils/dateFuncs";
import { ApolloError } from "apollo-server";

const resolver = {
    BaseModel: {
        __resolveType: (value: any): string => {
            return "BaseModel";
        }
    },
    BaseResponse: {
        __resolveType: (value): string => {
            return "BaseResponse";
        }
    },
    DateTimeRange: {
        interval: ({ from, to }) => {
            return Math.floor(
                (new Date(to).getTime() - new Date(from).getTime()) / ONE_MINUTE
            );
        }
    },
    Day: {
        SUN: DayEnum.SUN,
        MON: DayEnum.MON,
        TUE: DayEnum.TUE,
        WED: DayEnum.WED,
        THU: DayEnum.THU,
        FRI: DayEnum.FRI,
        SAT: DayEnum.SAT
    },
    Period: {
        days: (obj: any) => daysNumToArr(obj.days),
        // isIn: (obj: PeriodCls, { date }) => {
        //     obj.validate();
        //     return obj.isIn(date);
        // },
        intersactions: (
            obj: PeriodCls,
            { period }: { period: PeriodCls }
        ): PeriodCls | null => {
            obj.validate();
            const p = new PeriodCls(period);
            return obj.intersactions(p);
        }
    },
    CustomField: {
        list: (parent: CustomField): string[] => {
            if (parent.type === "LIST") {
                return parent.list;
            } else {
                return [];
            }
        }
    },
    Query: {
        dateTimeTest: (_: any, { date }: { date: Date }) => {
            console.log(date.toISOString());
            return date;
        },
        periodTest: (
            _: any,
            {
                param: { periods, offset }
            }: { param: { periods: PeriodInput[]; offset: number } }
        ) => {
            const periodClasses = splitPeriods(periods, offset);
            const result = mergePeriods(periodClasses, offset);
            return result;
        },
        countries: async (_, { countryName }): Promise<any[]> => {
            const result = await CountryInfoModel.find({
                countryName: new RegExp(countryName, "i")
            });
            return result || [];
        },
        currentCountry: defaultResolver(
            async ({ context: { req } }): Promise<Zoneinfo> => {
                const {
                    time_zone,
                    calling_code,
                    country_code2,
                    country_name
                } = await getGeoInfoByIP(getIP(req)[0]);

                if (!time_zone) {
                    throw new ApolloError(
                        `Timezone is falcy value ${time_zone}`,
                        "TIMEZONE_IS_FALCY"
                    );
                }
                return {
                    tz: time_zone.name || "",
                    callingCode: calling_code || "",
                    code: country_code2 || "",
                    name: country_name || "",
                    offset: time_zone.offset || -1
                };
            }
        ),
        includeDays: (_, { days }) => {
            return daysNumToArr(days);
        },
        GenCodeTest: (
            __: any,
            { param: { id = new ObjectId(), units, digits } }
        ): any => {
            return {
                id,
                code: genCode(id)
            };
        }
    }
};

export default resolver;
