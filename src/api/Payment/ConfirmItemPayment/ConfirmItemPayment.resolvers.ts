import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ConfirmItemPaymentResponse,
    ConfirmItemPaymentMutationArgs,
    SmsTriggerEvent
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { findItem } from "../../../models/Item/ItemModelFunctions";
import {
    findTransaction,
    setTransactionPayStatusToDone
} from "../../../models/Transaction/transactionFuncs";
import { ERROR_CODES } from "../../../types/values";
import { ApolloError } from "apollo-server";
import { StoreModel } from "../../../models/Store/Store";
import {
    getReplacementSetsForItem,
    SendSmsWithTriggerEvent
} from "../../../models/Item/ItemSmsFunctions";
import { UserModel } from "../../../models/User";
import { ItemCls, ItemModel } from "../../../models/Item/Item";
import { ProductCls } from "../../../models/Product/Product";
import { findProduct } from "../../../models/Product/productFunctions";

export const ConfirmItemPaymentFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ConfirmItemPaymentResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            itemId,
            input: { amount, currency, payResult, paymethod }
        } = args as ConfirmItemPaymentMutationArgs;
        const item = await findItem(itemId);
        if (!item.transactionId) {
            throw new Error("결제대상 Item이 아닙니다.");
        }
        const transaction = await findTransaction(item.transactionId);

        if (!payResult) {
            throw new Error("결제 결과 input 누락");
        }

        const result = setTransactionPayStatusToDone(transaction, {
            amount,
            paymethod,
            currency: currency!!,
            payResultInput: payResult
        });
        console.log({
            historyItem: result
        });
        await transaction.save({ session });
        const product = await findProduct(item.productId);

        await ItemModel.updateOne(
            {
                _id: item._id
            },
            {
                $set: {
                    expiresAt: undefined
                }
            }
        );

        await SendSmsForStoreUser(product, item);
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

/**
 * 결제 사용시에는 결제 완료 시에 문자를 보내야함
 * 따라서 Nicepay에서 ConfirmItem로 request가 이루어질떄 문자 보내는걸로...
 */
const SendSmsForStoreUser = async (
    product: DocumentType<ProductCls>,
    item: DocumentType<ItemCls>
) => {
    const smsKey = (await UserModel.findById(product.userId))?.smsKey;
    // trigger검색: Event & tags 검색(storeId)
    if (smsKey && item.phoneNumber) {
        // Send for buyer
        const tags = [
            {
                key: "storeId",
                value: item.storeId.toHexString()
            }
        ];
        const store = await StoreModel.findById(item.storeId);
        if (!store) {
            throw new ApolloError(
                "존재하지 않는 StoreId입니다...",
                ERROR_CODES.UNEXIST_STORE
            );
        }
        const event: SmsTriggerEvent = "ITEM_CREATED";

        const eventForSeller: SmsTriggerEvent = "ITEM_CREATED_FOR_SELLER";

        const myObject = await getReplacementSetsForItem(item);

        // SMS 전송 => Buyer에게 전송
        await SendSmsWithTriggerEvent({
            smsKey,
            event,
            tags,
            recWithReplSets: [
                {
                    receivers: [
                        // 국가코드 제거하자 ㅜㅜ
                        item.phoneNumber.replace("+82", "")
                    ],
                    replacementSets: myObject
                }
            ]
        });

        if (store.manager.phoneNumber) {
            await SendSmsWithTriggerEvent({
                smsKey,
                event: eventForSeller,
                tags,
                recWithReplSets: [
                    {
                        receivers: [
                            store.manager.phoneNumber.replace("+82", "")
                        ],
                        replacementSets: myObject
                    }
                ]
            });
        }
    }
};

const resolvers: Resolvers = {
    Mutation: {
        ConfirmItemPayment: defaultResolver(ConfirmItemPaymentFunc)
    }
};
export default resolvers;
