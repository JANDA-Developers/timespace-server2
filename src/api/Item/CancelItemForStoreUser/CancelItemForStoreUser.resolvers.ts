import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CancelItemForStoreUserResponse,
    CancelItemForStoreUserMutationArgs,
    SmsTriggerEvent
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { StoreUserCls } from "../../../models/StoreUser/StoreUser";
import { StoreModel } from "../../../models/Store/Store";
import { UserModel } from "../../../models/User";
import {
    getReplacementSetsForItem,
    SendSmsWithTriggerEvent
} from "../../../models/Item/ItemSmsFunctions";
import { ProductModel } from "../../../models/Product/Product";

export const CancelItemForStoreUserFunc = async ({
    args,
    context: { req }
}): Promise<CancelItemForStoreUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser }: { storeUser: DocumentType<StoreUserCls> } = req;
        const {
            comment,
            itemCode
        } = args as CancelItemForStoreUserMutationArgs;

        const item = await ItemModel.findByCode(itemCode);
        if (!item.storeUserId.equals(storeUser._id)) {
            throw new ApolloError(
                "해당 Item에 대한 사용 권한이 없습니다.",
                ERROR_CODES.ACCESS_DENY_ITEM
            );
        }
        await item
            .applyStatus("CANCELED", {
                comment: comment || undefined
            })
            .save({ session });

        // 문자를 보내야 하는데... 문자를 보내려면 관리자의 smsKey를 알아야함. 이하 그 과정임.
        const product = await ProductModel.findById(item.productId);
        const store = product?.storeId
            ? await StoreModel.findById(product.storeId)
            : undefined;
        const user = await UserModel.findById(store?.userId);
        if (!user) {
            throw new ApolloError(
                "존재하지 않는 UserId",
                ERROR_CODES.UNEXIST_USER
            );
        }
        const smsKey = user.smsKey;
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
        } // 문자 전송 끝.
        await item.save({ session });

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        CancelItemForStoreUser: defaultResolver(
            privateResolverForStoreUser(CancelItemForStoreUserFunc)
        )
    }
};
export default resolvers;
