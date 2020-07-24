import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    PermitItemResponse,
    PermitItemInput,
    SmsTriggerEvent
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";
import { ProductModel } from "../../../models/Product/Product";
import { UserModel } from "../../../models/User";
import {
    SendSmsWithTriggerEvent,
    getReplacementSetsForItem
} from "../../../models/Item/ItemSmsFunctions";

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

                        const smsKey = (
                            await UserModel.findById(cognitoUser._id).session(
                                session
                            )
                        )?.smsKey;
                        // trigger검색: Event & tags 검색(storeId)
                        if (smsKey && item.phoneNumber) {
                            // Send for buyer
                            const tags = [
                                {
                                    key: "storeId",
                                    value: item.storeId.toHexString()
                                }
                            ];
                            const event: SmsTriggerEvent = "ITEM_PERMITTED";

                            // SMS 전송
                            await SendSmsWithTriggerEvent({
                                smsKey,
                                event,
                                tags,
                                recWithReplSets: [
                                    {
                                        receivers: [
                                            item.phoneNumber.replace("+82", "")
                                        ],
                                        replacementSets: await getReplacementSetsForItem(
                                            item
                                        )
                                    }
                                ]
                            });
                        }
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
