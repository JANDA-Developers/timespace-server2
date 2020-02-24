import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CancelItemResponse, CancelItemMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { StoreModel } from "../../../models/Store/Store";

const resolvers: Resolvers = {
    Mutation: {
        CancelItem: defaultResolver(
            privateResolver(
                async (
                    { parent, info, args, context: { req } },
                    stack
                ): Promise<CancelItemResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { param } = args as CancelItemMutationArgs;
                        const item = await ItemModel.findById(param.itemId);
                        if (!item) {
                            throw new ApolloError(
                                "존재하지 않는 Item 입니다",
                                ERROR_CODES.UNEXIST_ITEM,
                                {
                                    loc: "CancelItem",
                                    data: {
                                        item,
                                        cognitoUser
                                    }
                                }
                            );
                        }
                        const store = await StoreModel.findById(item.storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                ERROR_CODES.UNEXIST_STORE,
                                {
                                    loc: "CancelItem",
                                    data: {
                                        store,
                                        item,
                                        cognitoUser
                                    }
                                }
                            );
                        }
                        await item
                            .applyStatus("CANCELED", {
                                workerId: cognitoUser._id
                            })
                            .save({ session });
                        await item.save({ session });

                        await session.commitTransaction();
                        session.endSession();

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
