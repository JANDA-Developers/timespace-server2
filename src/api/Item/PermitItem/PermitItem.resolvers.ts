import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { PermitItemResponse, PermitItemInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";
import { ProductModel } from "../../../models/Product/Product";
import { deniedItems } from "../CancelItem/CancelItem.resolvers";

const resolvers: Resolvers = {
    Mutation: {
        PermitItem: defaultResolver(
            privateResolver(
                async (
                    { args, context: { req } },
                    stack
                ): Promise<PermitItemResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { param }: { param: PermitItemInput } = args;
                        const item = await ItemModel.findById(param.itemId);
                        if (!item) {
                            throw new ApolloError(
                                "존재하지 않는 ItemId",
                                ERROR_CODES.UNEXIST_ITEM,
                                {
                                    loc: "PermitItem",
                                    param,
                                    user: cognitoUser,
                                    item
                                }
                            );
                        }
                        const product = await ProductModel.findById(
                            item.productId
                        );
                        if (!product) {
                            throw new ApolloError(
                                "존재하지 않을리 없는 ProductId",
                                ERROR_CODES.UNEXIST_PRODUCT
                            );
                        }
                        await item
                            .applyStatus("PERMITTED", {
                                workerId: new ObjectId(cognitoUser._id),
                                comment: param.comment || undefined
                            })
                            .save({
                                session
                            });
                        await item.save({
                            session
                        });
                        // 취소 로직 ㄱㄱ

                        const duplItems = await ItemModel.find({
                            "dateTimeRange.from": {
                                $lt: item.dateTimeRange.to
                            },
                            "dateTimeRange.to": {
                                $gt: item.dateTimeRange.from
                            },
                            expiresAt: {
                                $exists: false
                            }
                        });

                        const itemDeniedResult = await Promise.all(
                            duplItems.map(async i => {
                                return await deniedItems(
                                    {
                                        args: { itemId: i._id },
                                        context: { req }
                                    },
                                    stack
                                );
                            })
                        );
                        stack.push({
                            itemDeniedResult
                        });
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
