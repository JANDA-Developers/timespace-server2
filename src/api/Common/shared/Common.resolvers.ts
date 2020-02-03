import { Resolvers } from "../../../types/resolvers";
import { CountryInfoModel } from "../../../models/CountryInfo";

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
        }
    }
};

export default resolver;
