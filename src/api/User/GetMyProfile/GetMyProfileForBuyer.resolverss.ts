import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetMyProfileForBuyerResponse } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { BuyerModel } from "../../../models/Buyer";

export const GetMyProfileForBuyerFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetMyProfileForBuyerResponse> => {
    const { cognitoUser } = req;
    try {
        const buyer = await BuyerModel.findUser(cognitoUser);
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
            privateResolver(GetMyProfileForBuyerFunc)
        )
    }
};
export default resolvers;
