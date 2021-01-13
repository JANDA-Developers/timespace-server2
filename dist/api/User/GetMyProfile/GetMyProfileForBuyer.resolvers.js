"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMyProfileForBuyerFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Buyer_1 = require("../../../models/Buyer");
exports.GetMyProfileForBuyerFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const { cognitoBuyer } = req;
    stack.push({ cognitoBuyer });
    try {
        const buyer = await Buyer_1.BuyerModel.findBuyer(cognitoBuyer);
        stack.push(buyer);
        console.log(stack);
        return {
            ok: true,
            error: null,
            data: {
                buyer: buyer
            }
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Query: {
        GetMyProfileForBuyer: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForBuyer(exports.GetMyProfileForBuyerFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetMyProfileForBuyer.resolvers.js.map