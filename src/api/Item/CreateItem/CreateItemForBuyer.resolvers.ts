import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateItemForBuyerResponse, CreateItemForBuyerInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item/Item";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";
import { ObjectId } from "mongodb";
import { ONE_MINUTE } from "../../../utils/dateFuncs";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";

const resolvers: Resolvers = {
    Mutation: {
        CreateItemForBuyer: defaultResolver(
            privateResolver(
                async ({
                    args,
                    context: { req }
                }): Promise<CreateItemForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const {
                            param
                        }: { param: CreateItemForBuyerInput } = args;
                        if (cognitoUser["custom:isBuyer"] !== "1") {
                            throw new ApolloError(
                                "상품 구매 권한이 없습니다. 먼저 Buyer 인증을 해주세요.",
                                ERROR_CODES.ACCESS_DENY_ITEM
                            );
                        }
                        const now = new Date();
                        const product = await ProductModel.findByCode(
                            param.productCode
                        );
                        const item = new ItemModel();
                        if (param.dateTimeRange) {
                            const { from, to } = param.dateTimeRange;
                            item.dateTimeRange = {
                                from,
                                to,
                                interval: Math.floor(
                                    (to.getTime() - from.getTime()) / ONE_MINUTE
                                )
                            };
                        }
                        for (const fieldName in param) {
                            const element = param[fieldName];
                            item[fieldName] = element;
                        }
                        item.productId = product._id;
                        item.storeId = product.storeId;
                        item.buyerId = new ObjectId(cognitoUser._id);
                        await item.setCode(product.code, now);

                        // validation 필요함!
                        // needConfirm
                        const dateTimeRange = param.dateTimeRange;
                        if (dateTimeRange) {
                            const list = await product.getSegmentSchedules(
                                new DateTimeRangeCls(dateTimeRange)
                            );
                            if (list.length === 0) {
                                throw new ApolloError(
                                    "이용 가능한 시간이 아닙니다.",
                                    ERROR_CODES.UNAVAILABLE_BUSINESSHOURS
                                );
                            }

                            const isAvailable = list
                                .map(l => !l.soldOut)
                                .filter(t => t).length;
                            if (!isAvailable) {
                                throw new ApolloError(
                                    "SoldOut인 Segment가 존재합니다.",
                                    ERROR_CODES.UNAVAILABLE_SOLD_OUT,
                                    {
                                        segment: list
                                    }
                                );
                            }
                        }
                        await item
                            .applyStatus(
                                product.needToConfirm ? "PENDING" : "PERMITTED",
                                {
                                    workerId: product.needToConfirm
                                        ? item.buyerId
                                        : product.userId
                                    // comment
                                }
                            )
                            .save({ session });

                        // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ

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
