import { ApolloError } from "apollo-server";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetItemForBuyerResponse, GetItemForBuyerInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";

const resolvers: Resolvers = {
    Query: {
        GetItemForBuyer: defaultResolver(
            privateResolver(
                async (
                    { args, context: { req } },
                    stack
                ): Promise<GetItemForBuyerResponse> => {
                    try {
                        const { cognitoUser } = req;
                        const { param }: { param: GetItemForBuyerInput } = args;
                        const item = await ItemModel.findByCode(param.itemCode);
                        if (!item.buyerId.equals(cognitoUser._id)) {
                            stack.push({ item });
                            stack.push({ cognitoUser });
                            throw new ApolloError(
                                "접근 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_ITEM,
                                {
                                    cognitoUser
                                }
                            );
                        }
                        return {
                            ok: true,
                            error: null,
                            data: item as any
                        };
                    } catch (error) {
                        return await errorReturn(error);
                    }
                }
            )
        )
    }
};
export default resolvers;
