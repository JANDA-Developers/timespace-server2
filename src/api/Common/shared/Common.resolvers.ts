/* eslint-disable @typescript-eslint/camelcase */
import { Resolvers } from "../../../types/resolvers";
import { CountryInfoModel } from "../../../models/CountryInfo";
import { getGeoInfoByIP } from "../../../utils/geoLocationAPI";
import { getIP } from "../../../utils/utils";
import { Zoneinfo } from "../../../types/graph";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";

const resolver: Resolvers = {
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
    Query: {
        countries: async (_, { countryName }): Promise<any[]> => {
            const result = await CountryInfoModel.find({
                countryName: new RegExp(countryName, "i")
            });
            return result || [];
        },
        currentCountry: defaultResolver(
            async (
                { parent, args, context: { req } },
                stack
            ): Promise<Zoneinfo> => {
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
        )
    }
};

export default resolver;
