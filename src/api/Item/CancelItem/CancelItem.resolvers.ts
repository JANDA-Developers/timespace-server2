import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CancelItemResponse,
    CancelItemMutationArgs,
    SmsFormatAttribute
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { StoreModel } from "../../../models/Store/Store";
import { SmsManager } from "../../../models/Sms/SmsManager/SmsManager";
import { ObjectId } from "mongodb";
import { ONE_HOUR } from "../../../utils/dateFuncs";
import { UserModel } from "../../../models/User";
import { ProductModel } from "../../../models/Product/Product";

export const deniedItems = async ({
    args,
    context: { req }
}, stack: any[]): Promise<CancelItemResponse> => {
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
        item.applyStatus("CANCELED", {
            workerId: cognitoUser._id
        });
        await item.save({ session });

        const seller = await UserModel.findBySub(cognitoUser.sub);
        const smsKey = seller.smsKey;
        const product = await ProductModel.findById(item.productId);
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

        return {
            ok: true,
            error: null,
            data: item as any
        };
    } catch (error) {
        return await errorReturn(error, session);
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
        event: "ON_BOOKING_DENIED",
        formatAttributes,
        receivers
    });
};

const resolvers: Resolvers = {
    Mutation: {
        CancelItem: defaultResolver(privateResolver(deniedItems))
    }
};
export default resolvers;
