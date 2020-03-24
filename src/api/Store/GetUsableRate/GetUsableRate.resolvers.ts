import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetUsableRateResponse, GetUsableRateInput } from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store/Store";
import { ObjectId } from "mongodb";
import { getUsableRateQuery } from "./UsableRatePipeline";

export const GetUsableRateFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetUsableRateResponse> => {
    try {
        const { param }: { param: GetUsableRateInput } = args;
        stack.push({
            param
        });
        const { storeCode, dateRange, filter } = param;

        // store Get!
        const store = await StoreModel.findByCode(storeCode);

        const result = await makeFilterQuery({
            ...filter,
            storeId: store._id,
            dateRange
        });

        return {
            ok: true,
            error: null,
            data: result
        };
    } catch (error) {
        const result = await errorReturn(error);
        return {
            ...result,
            data: []
        };
    }
};

const makeFilterQuery = async (filter: any) => {
    const storeId: ObjectId = filter.storeId;
    // const originDTRange = {
    //     from: new Date(),
    //     to: new Date()
    // };
    const result = await getUsableRateQuery(storeId, filter.dateRange);
    // console.log(result);

    // TODO: 렛츠고 ProductId 쿼리

    return result;
};

const resolvers: Resolvers = {
    Query: {
        GetUsableRate: defaultResolver(GetUsableRateFunc)
    }
};
export default resolvers;
