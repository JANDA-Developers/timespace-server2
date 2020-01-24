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
        countries: async (): Promise<any[]> => await ZoneInfoModel.countries()
    }
};

export default resolver;
