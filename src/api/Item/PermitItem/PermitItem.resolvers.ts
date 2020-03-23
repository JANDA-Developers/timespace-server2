import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    PermitItemResponse,
    PermitItemInput,
    SmsFormatAttribute
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";
import { SmsManager } from "../../../models/Sms/SmsManager/SmsManager";
import { ProductModel } from "../../../models/Product/Product";
import { UserModel } from "../../../models/User";
import { ONE_HOUR } from "../../../utils/dateFuncs";

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
                        const user = await UserModel.findBySub(cognitoUser.sub);

                        const smsKey = user.smsKey;
                        const product = await ProductModel.findById(
                            item.productId
                        );
                        if (!product) {
                            throw new ApolloError(
                                "존재하지 않을리 없는 ProductId",
                                ERROR_CODES.UNEXIST_PRODUCT
                            );
                        }
                        if (smsKey) {
                            // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ
                            const f = new Date(
                                item.dateTimeRange.from.getTime() +
                                    user.zoneinfo.offset * ONE_HOUR
                            );
                            const t = new Date(
                                item.dateTimeRange.to.getTime() +
                                    user.zoneinfo.offset * ONE_HOUR
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
        event: "ON_BOOKING_PERMITTED",
        formatAttributes,
        receivers
    });
};
export default resolvers;
