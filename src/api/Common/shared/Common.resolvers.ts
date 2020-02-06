/* eslint-disable @typescript-eslint/camelcase */
import { CountryInfoModel } from "../../../models/CountryInfo";
import { getGeoInfoByIP } from "../../../utils/geoLocationAPI";
import { getIP, daysNumToArr } from "../../../utils/utils";
import { Zoneinfo, PeriodInput } from "../../../types/graph";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { PeriodCls } from "../../../utils/Period";

const resolver = {
    BaseModel: {
        __resolveType: (value: any): string => {
            return "test";
        }
    },
    BaseResponse: {
        __resolveType: (value): string => {
            return "BaseResponse";
        }
    },
    CountryInfo: {},
    Day: {
        // TODO: 여기서 연구해야 할것은... 뭐가있냐 다한것 같은데? 좀더 생각해보자
        SUN: 0b0000001,
        MON: 0b0000010,
        TUE: 0b0000100,
        WED: 0b0001000,
        THU: 0b0010000,
        FRI: 0b0100000,
        SAT: 0b1000000
    },
    // TODO: 여기서 더 연구해야 할것은... GenderOptions을 Gender로 % 연산 했을때 나머지가 0이면 포함관계, 0이 아니면 포함되지 않음.. 렛츠고
    GenderOption: {
        MALE: 2,
        FEMALE: 3,
        ANY: 6
    },
    Gender: {
        MALE: 2,
        FEMALE: 3
    },
    Period: {
        days: (obj: PeriodCls) => daysNumToArr(obj.days),
        isIn: (obj: PeriodCls, { date }) => {
            obj.validate();
            return obj.isIn(date);
        },
        intersactions: (
            obj: PeriodCls,
            { period }: { period: PeriodCls }
        ): PeriodCls | null => {
            obj.validate();
            const p = new PeriodCls(period);
            return obj.intersactions(p);
        }
        // differences: () => {},
        // disperse: () => {}
    },
    Query: {
        periodTest: (_, { param }: { param: PeriodInput }) => {
            return new PeriodCls({
                ...param,
                days: (param.days as any[]).reduce(
                    (d1: number, d2: number) => d1 + d2
                )
            });
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
                return {
                    tz: time_zone?.name || "",
                    callingCode: calling_code || "",
                    code: country_code2 || "",
                    name: country_name || "",
                    offset: time_zone?.offset || -1
                };
            }
        ),
        includeDays: (_, { days }) => {
            return daysNumToArr(days);
        }
    }
};

export default resolver;
