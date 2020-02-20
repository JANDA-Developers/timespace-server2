import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateItemResponse, CreateItemMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";
import { ItemModel } from "../../../models/Item/Item";
import { ONE_MINUTE } from "../../../utils/dateFuncs";
import { ObjectId } from "mongodb";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";

const resolvers: Resolvers = {
    Mutation: {
        CreateItem: defaultResolver(
            privateResolver(
                async (
                    { parent, info, args, context: { req } },
                    stack
                ): Promise<CreateItemResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { param } = args as CreateItemMutationArgs;
                        const now = new Date();
                        const product = await ProductModel.findById(
                            param.productId
                        );
                        if (!product) {
                            throw new ApolloError(
                                "존재하지 않는 Product",
                                ERROR_CODES.UNEXIST_PRODUCT
                            );
                        }
                        const item = new ItemModel();
                        if (param.name && param.phoneNumber) {
                            item.memo = `${param.name} / ${param.phoneNumber}`;
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
