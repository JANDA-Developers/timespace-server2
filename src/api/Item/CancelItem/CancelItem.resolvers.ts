import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CancelItemResponse,
    CancelItemMutationArgs,
    SmsTriggerEvent
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { StoreModel } from "../../../models/Store/Store";
import { ProductModel } from "../../../models/Product/Product";
import { UserModel } from "../../../models/User";
import {
    SendSmsWithTriggerEvent,
    getReplacementSetsForItem
} from "../../../models/Item/ItemFunctions";

export const deniedItems = async (
    { args, context: { req } },
    stack: any[]
): Promise<CancelItemResponse> => {
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

        const product = await ProductModel.findById(item.productId);
        if (!product) {
            throw new ApolloError(
                "존재하지 않을리 없는 ProductId",
                ERROR_CODES.UNEXIST_PRODUCT
            );
        }

        const smsKey = (
            await UserModel.findById(cognitoUser._id).session(session)
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
            const event: SmsTriggerEvent = "ITEM_CANCELED";

            // SMS 전송
            await SendSmsWithTriggerEvent({
                smsKey,
                event,
                tags,
                recWithReplSets: [
                    {
                        receivers: [item.phoneNumber],
                        replacementSets: await getReplacementSetsForItem(item)
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
};
const resolvers: Resolvers = {
    Mutation: {
        CancelItem: defaultResolver(privateResolver(deniedItems))
    }
};
export default resolvers;
