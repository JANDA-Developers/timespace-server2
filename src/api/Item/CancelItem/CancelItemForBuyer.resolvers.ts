import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CancelItemForBuyerResponse,
    CancelItemForBuyerInput,
    SmsFormatAttribute
} from "GraphType";
import {
    defaultResolver,
    privateResolverForBuyer
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";
import { SmsManager } from "../../../models/Sms/SmsManager/SmsManager";
import { ONE_HOUR } from "../../../utils/dateFuncs";
import { UserModel } from "../../../models/User";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";

const resolvers: Resolvers = {
    Mutation: {
        CancelItemForBuyer: defaultResolver(
            privateResolverForBuyer(
                async (
                    { parent, info, args, context: { req } },
                    stack
                ): Promise<CancelItemForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoBuyer } = req;
                        const {
                            param
                        }: { param: CancelItemForBuyerInput } = args;
                        // TODO: 렛츠고 ㄱㄱ
                        const item = await ItemModel.findByCode(param.itemCode);
                        await item
                            .applyStatus("CANCELED", {
                                comment: param.comment || undefined,
                                workerId: new ObjectId(cognitoBuyer._id)
                            })
                            .save({ session });
                        await item.save({ session });

                        const product = await ProductModel.findById(
                            item.productId
                        );
                        if (!product) {
                            throw new ApolloError(
                                "존재하지 않는 Product",
                                ERROR_CODES.UNEXIST_PRODUCT
                            );
                        }
                        const seller = await UserModel.findById(product.userId);
                        if (!seller) {
                            throw new ApolloError(
                                "존재하지 않는 Seller",
                                ERROR_CODES.UNAUTHORIZED_USER
                            );
                        }
                        const smsKey = seller.smsKey;
                        if (smsKey) {
                            // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ
                            const f = new Date(
                                item.dateTimeRange.from.getTime() +
                                    seller.zoneinfo.offset * ONE_HOUR
                            );
                            const t = new Date(
                                item.dateTimeRange.to.getTime() +
                                    seller.zoneinfo.offset * ONE_HOUR
                            );
                            await sendSmsAfterCreate(
                                smsKey,
                                stack,
                                [
                                    {
                                        key: "NAME",
                                        value: item.name
                                    },
                                    {
                                        key: "PRODUCT_NAME",
                                        value: product.name
                                    },
                                    {
                                        key: "FROM",
                                        value: f
                                            .toISOString()
                                            .split("T")[1]
                                            .substr(0, 5)
                                    },
                                    {
                                        key: "TO",
                                        value: t
                                            .toISOString()
                                            .split("T")[1]
                                            .substr(0, 5)
                                    },
                                    {
                                        key: "DATE",
                                        value: f.toISOString().split("T")[0]
                                    }
                                ],
                                [(item.phoneNumber || "").replace("+82", "")]
                            );
                        }

                        await session.commitTransaction();
                        session.endSession();
                        // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ
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

const sendSmsAfterCreate = async (
    key: ObjectId,
    stack: any[],
    formatAttributes: SmsFormatAttribute[],
    receivers: string[]
) => {
    stack.push(
        { key },
        {
            formatAttributes
        }
    );
    const smsManager = new SmsManager(key);
    await smsManager.sendWithTrigger({
        event: "ON_BOOKING_CANCELED",
        formatAttributes,
        receivers
    });
};

export default resolvers;
