import { Resolvers } from "../../../types/resolvers";
import { ZoneInfoModel } from "../../../models/ZoneInfo";

const resolver: Resolvers = {
    BaseModel: {
        __resolveType: (value: any): string => {
            console.log(value);
            return "test";
        }
    },
    ZoneInfo: {},
    Query: {
        countries: async (_, { countryName }): Promise<any[]> =>
            await ZoneInfoModel.countries(),
        timezone: async (
            _,
            { countryCode }: { countryCode: string }
        ): Promise<any[]> => await ZoneInfoModel.cities(countryCode)
    }
};

export default resolver;
