"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUsableRateFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Store_1 = require("../../../models/Store/Store");
const UsableRatePipeline_1 = require("./UsableRatePipeline");
exports.GetUsableRateFunc = async ({ parent, info, args, context: { req } }, stack) => {
    try {
        const { param } = args;
        stack.push({
            param
        });
        const { storeCode, dateRange, filter } = param;
        // store Get!
        const store = await Store_1.StoreModel.findByCode(storeCode);
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
    }
    catch (error) {
        const result = await utils_1.errorReturn(error);
        return {
            ...result,
            data: []
        };
    }
};
const makeFilterQuery = async (filter) => {
    const storeId = filter.storeId;
    // const originDTRange = {
    //     from: new Date(),
    //     to: new Date()
    // };
    const result = await UsableRatePipeline_1.getUsableRateQuery(storeId, filter.dateRange);
    // console.log(result);
    // TODO: 렛츠고 ProductId 쿼리
    return result;
};
const resolvers = {
    Query: {
        GetUsableRate: resolverFuncWrapper_1.defaultResolver(exports.GetUsableRateFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetUsableRate.resolvers.js.map