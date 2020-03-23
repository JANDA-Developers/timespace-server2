import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CreateItemResponse,
    CreateItemMutationArgs,
    SmsFormatAttribute
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";
import { ItemModel } from "../../../models/Item/Item";
import { ONE_MINUTE, ONE_HOUR } from "../../../utils/dateFuncs";
import { ObjectId } from "mongodb";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";
import { StoreModel } from "../../../models/Store/Store";
import { UserModel } from "../../../models/User";
import { SmsManager } from "../../../models/Sms/SmsManager/SmsManager";

const resolvers: Resolvers = {
    Mutation: {
        CreateItem: defaultResolver(
            privateResolver(
                async (
                    { args, context: { req } },
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
                        const store = await StoreModel.findById(
                            product.storeId
                        );
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 StoreId",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }
                        for (const fieldName in param) {
                            let element = param[fieldName];
                            if (fieldName === "customFieldValues") {
                                const field = store.customFields;
                                element = param.customFieldValues.map(
                                    cstField => {
                                        const key = new ObjectId(cstField.key);
                                        const label = field.find(f =>
                                            key.equals(f.key)
                                        )?.label;
                                        return {
                                            key,
                                            label,
                                            value: cstField.value
                                        };
                                    }
                                );
                            }
                            item[fieldName] = element;
                        }
                        item.productId = product._id;
                        item.storeId = product.storeId;
                        item.userId = new ObjectId(cognitoUser._id);
                        await item
                            .applyStatus("PERMITTED", {
                                workerId: new ObjectId(cognitoUser._id)
                            })
                            .save({ session });
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

                        const seller = await UserModel.findById(product.userId);
                        if (!seller) {
                            throw new ApolloError(
                                "존재하지 않는 UserId",
                                ERROR_CODES.UNEXIST_USER,
                                {
                                    errorInfo: "Product객체에 UserId 에러임"
                                }
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
                                [(param.phoneNumber || "").replace("+82", "")]
                            );
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
        event: "ON_BOOKING_CONFIRMED",
        formatAttributes,
        receivers
    });
};

export default resolvers;
