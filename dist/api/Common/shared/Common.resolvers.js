"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/camelcase */
const CountryInfo_1 = require("../../../models/CountryInfo");
const geoLocationAPI_1 = require("../../../utils/geoLocationAPI");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Period_1 = require("../../../utils/Period");
const genId_1 = require("../../../models/utils/genId");
const mongodb_1 = require("mongodb");
const periodFuncs_1 = require("../../../utils/periodFuncs");
const values_1 = require("../../../types/values");
const dateFuncs_1 = require("../../../utils/dateFuncs");
const apollo_server_1 = require("apollo-server");
const resolver = {
    BaseModel: {
        __resolveType: (value) => {
            return "BaseModel";
        }
    },
    BaseResponse: {
        __resolveType: (value) => {
            return "BaseResponse";
        }
    },
    DateTimeRange: {
        interval: ({ from, to }) => {
            return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / dateFuncs_1.ONE_MINUTE);
        }
    },
    Day: {
        SUN: values_1.DayEnum.SUN,
        MON: values_1.DayEnum.MON,
        TUE: values_1.DayEnum.TUE,
        WED: values_1.DayEnum.WED,
        THU: values_1.DayEnum.THU,
        FRI: values_1.DayEnum.FRI,
        SAT: values_1.DayEnum.SAT
    },
    Period: {
        days: (obj) => periodFuncs_1.daysNumToArr(obj.days),
        // isIn: (obj: PeriodCls, { date }) => {
        //     obj.validate();
        //     return obj.isIn(date);
        // },
        intersactions: (obj, { period }) => {
            obj.validate();
            const p = new Period_1.PeriodCls(period);
            return obj.intersactions(p);
        }
    },
    CustomField: {
        list: (parent) => {
            if (parent.type === "LIST") {
                return parent.list;
            }
            else {
                return [];
            }
        }
    },
    Query: {
        dateTimeTest: (_, { date }) => {
            console.log(date.toISOString());
            return date;
        },
        periodTest: (_, { param: { periods, offset } }) => {
            const periodClasses = periodFuncs_1.splitPeriods(periods, offset);
            const result = periodFuncs_1.mergePeriods(periodClasses, offset);
            return result;
        },
        countries: async (_, { countryName }) => {
            const result = await CountryInfo_1.CountryInfoModel.find({
                countryName: new RegExp(countryName, "i")
            });
            return result || [];
        },
        currentCountry: resolverFuncWrapper_1.defaultResolver(async ({ context: { req } }) => {
            const { time_zone, calling_code, country_code2, country_name } = await geoLocationAPI_1.getGeoInfoByIP(utils_1.getIP(req)[0]);
            if (!time_zone) {
                throw new apollo_server_1.ApolloError(`Timezone is falcy value ${time_zone}`, "TIMEZONE_IS_FALCY");
            }
            return {
                tz: time_zone.name || "",
                callingCode: calling_code || "",
                code: country_code2 || "",
                name: country_name || "",
                offset: time_zone.offset || -1
            };
        }),
        includeDays: (_, { days }) => {
            return periodFuncs_1.daysNumToArr(days);
        },
        GenCodeTest: (__, { param: { id = new mongodb_1.ObjectId(), units, digits } }) => {
            return {
                id,
                code: genId_1.genCode(id)
            };
        }
    }
};
exports.default = resolver;
//# sourceMappingURL=Common.resolvers.js.map