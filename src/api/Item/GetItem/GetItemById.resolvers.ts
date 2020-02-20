import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetItemByIdResponse, GetItemByIdInput } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    Query: {
        GetItemById: defaultResolver(
            privateResolver(
                async (
                    { parent, info, args, context: { req } },
                    stack
                ): Promise<GetItemByIdResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { param }: { param: GetItemByIdInput } = args;
                        const item = await ItemModel.findById(param.itemId);
                        if (!item) {
                            throw new ApolloError(
                                "존재하지 않는 ItemId",
                                ERROR_CODES.UNEXIST_ITEM
                            );
                        }
                        if (item.buyerId.equals(cognitoUser._id)) {
                            return {
                                ok: true,
                                error: null,
                                data: item as any
                            };
                        }
                        const user = await UserModel.findById(cognitoUser._id);
                        if (!user) {
                            throw new ApolloError(
                                "조회 권한이 없습니다",
                                ERROR_CODES.ACCESS_DENY_ITEM
                            );
                        }
                        if (
                            !user.stores.find(storeId =>
                                storeId.equals(item.storeId)
                            )
                        ) {
                            throw new ApolloError(
                                "조회 권한이 없습니다",
                                ERROR_CODES.ACCESS_DENY_ITEM
                            );
                        }
                        return {
                            ok: true,
                            error: null,
                            data: item as any
                        };
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};
export default resolvers;
