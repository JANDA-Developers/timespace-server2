import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetMyProfileForBuyerResponse } from "GraphType";
import {
    defaultResolver,
    privateResolverForBuyer
} from "../../../utils/resolverFuncWrapper";
import { BuyerModel } from "../../../models/Buyer";

export const GetMyProfileForBuyerFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetMyProfileForBuyerResponse> => {
    const { cognitoBuyer } = req;
    stack.push({ cognitoBuyer });
    try {
        const buyer = await BuyerModel.findBuyer(cognitoBuyer);
        stack.push(buyer);
        console.log(stack);
        return {
            ok: true,
            error: null,
            data: {
                buyer: buyer as any
            }
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetMyProfileForBuyer: defaultResolver(
            privateResolverForBuyer(GetMyProfileForBuyerFunc)
        )
    }
};
export default resolvers;
