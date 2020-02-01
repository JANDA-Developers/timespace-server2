import { Resolvers } from "../../../types/resolvers";
import { ZoneinfoModel } from "../../../models/Zoneinfo";

const resolver: Resolvers = {
    BaseModel: {
        __resolveType: (value: any): string => {
            console.log(value);
            return "test";
        }
    },
    Zoneinfo: {},
    Query: {
        countries: async (_, { countryName }): Promise<any[]> =>
            await ZoneinfoModel.countries(),
        timezone: async (
            _,
            { countryCode }: { countryCode: string }
        ): Promise<any[]> => await ZoneinfoModel.cities(countryCode)
    }
};

export default resolver;
