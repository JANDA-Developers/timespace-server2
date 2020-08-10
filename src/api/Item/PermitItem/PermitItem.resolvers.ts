import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
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
import { ItemModel, ItemCls } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";
import { ProductModel, ProductCls } from "../../../models/Product/Product";
import { UserModel } from "../../../models/User";
import {
    SendSmsWithTriggerEvent,
    getReplacementSetsForItem
} from "../../../models/Item/ItemSmsFunctions";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";

const resolvers: Resolvers = {
    Mutation: {
        PermitItem: defaultResolver(
            privateResolver(
                async ({
                    args,
                    context: { req }
                }): Promise<PermitItemResponse> => {
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
                        await checkDuplicate(item, product);
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

const checkDuplicate = async (
    item: DocumentType<ItemCls>,
    product: DocumentType<ProductCls>
): Promise<void> => {
    const dateTimeRange = item.dateTimeRange;

    const list = await product.getSegmentSchedules(
        new DateTimeRangeCls(dateTimeRange)
    );
    if (list.length === 0) {
        throw new ApolloError(
            "이용 가능한 시간이 아닙니다.",
            ERROR_CODES.UNAVAILABLE_BUSINESSHOURS
        );
    }

    const isAvailable =
        list.map(l => !l.soldOut).filter(t => t).length === list.length;

    if (!isAvailable) {
        throw new ApolloError(
            "인원 초과로 해당 예약을 승인할 수 없습니다.",
            ERROR_CODES.UNAVAILABLE_SOLD_OUT,
            {
                segment: list
            }
        );
    }
};

export default resolvers;
