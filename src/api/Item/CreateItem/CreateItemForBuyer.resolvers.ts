import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateItemForBuyerResponse, CreateItemForBuyerInput } from "GraphType";
import {
    defaultResolver,
    privateResolverForBuyer
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item/Item";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";
import { ObjectId } from "mongodb";
import { ONE_MINUTE, ONE_DAY } from "../../../utils/dateFuncs";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";
import { BuyerModel } from "../../../models/Buyer";

const resolvers: Resolvers = {
    Mutation: {
        CreateItemForBuyer: defaultResolver(
            privateResolverForBuyer(
                async (
                    { args, context: { req } },
                    stack: any[]
                ): Promise<CreateItemForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoBuyer } = req;
                        const {
                            param
                        }: { param: CreateItemForBuyerInput } = args;
                        const buyer = await BuyerModel.findBuyer(cognitoBuyer);
                        const now = new Date();
                        const product = await ProductModel.findByCode(
                            param.productCode
                        );

                        const item = new ItemModel();
                        if (!param.dateTimeRange) {
                            throw new ApolloError(
                                "날짜 범위를 선택해 주세요",
                                "PARAMETER_ERROR_DATETIMERANGE"
                            );
                        }
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
                        item.buyerId = new ObjectId(buyer._id);
                        await item.setCode(product.code, now);

                        // validation 필요함!
                        // needConfirm
                        const dateTimeRange = param.dateTimeRange;
                        if (dateTimeRange) {
                            const dtRangeCls = new DateTimeRangeCls(
                                dateTimeRange
                            );
                            const list = await product.getSegmentSchedules(
                                dtRangeCls
                            );
                            if (list.length === 0) {
                                throw new ApolloError(
                                    "이용 가능한 시간이 아닙니다.",
                                    ERROR_CODES.UNAVAILABLE_BUSINESSHOURS
                                );
                            }

                            // TODO: 여기서 걸러내자...
                            const now = new Date();
                            const interval =
                                (dtRangeCls.from.getTime() - now.getTime()) /
                                ONE_DAY;
                            if (
                                product.bookingPolicy.limitFirstBooking >
                                    interval &&
                                product.bookingPolicy.limitLastBooking <
                                    interval
                            ) {
                                throw new ApolloError(
                                    "예약 가능범위에 포함되지 않는 날짜입니다",
                                    ERROR_CODES.UNINCLUDED_BOOKING_DATERANGE
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
