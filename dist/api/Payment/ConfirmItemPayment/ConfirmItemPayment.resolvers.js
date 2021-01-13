"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmItemPaymentFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const ItemModelFunctions_1 = require("../../../models/Item/ItemModelFunctions");
const transactionFuncs_1 = require("../../../models/Transaction/transactionFuncs");
const values_1 = require("../../../types/values");
const apollo_server_1 = require("apollo-server");
const Store_1 = require("../../../models/Store/Store");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
const User_1 = require("../../../models/User");
const Item_1 = require("../../../models/Item/Item");
const productFunctions_1 = require("../../../models/Product/productFunctions");
exports.ConfirmItemPaymentFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { itemId, input: { amount, currency, payResult, paymethod } } = args;
        const item = await ItemModelFunctions_1.findItem(itemId);
        if (!item.transactionId) {
            throw new Error("결제대상 Item이 아닙니다.");
        }
        const transaction = await transactionFuncs_1.findTransaction(item.transactionId);
        if (!payResult) {
            throw new Error("결제 결과 input 누락");
        }
        const result = transactionFuncs_1.setTransactionPayStatusToDone(transaction, {
            amount,
            paymethod,
            currency: currency,
            payResultInput: payResult
        });
        console.log({
            historyItem: result
        });
        await transaction.save({ session });
        const product = await productFunctions_1.findProduct(item.productId);
        await Item_1.ItemModel.updateOne({
            _id: item._id
        }, {
            $set: {
                expiresAt: undefined
            }
        });
        await SendSmsForStoreUser(product, item);
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
/**
 * 결제 사용시에는 결제 완료 시에 문자를 보내야함
 * 따라서 Nicepay에서 ConfirmItem로 request가 이루어질떄 문자 보내는걸로...
 */
const SendSmsForStoreUser = async (product, item) => {
    var _a;
    const smsKey = (_a = (await User_1.UserModel.findById(product.userId))) === null || _a === void 0 ? void 0 : _a.smsKey;
    // trigger검색: Event & tags 검색(storeId)
    if (smsKey && item.phoneNumber) {
        // Send for buyer
        const tags = [
            {
                key: "storeId",
                value: item.storeId.toHexString()
            }
        ];
        const store = await Store_1.StoreModel.findById(item.storeId);
        if (!store) {
            throw new apollo_server_1.ApolloError("존재하지 않는 StoreId입니다...", values_1.ERROR_CODES.UNEXIST_STORE);
        }
        const event = "ITEM_CREATED";
        const eventForSeller = "ITEM_CREATED_FOR_SELLER";
        const myObject = await ItemSmsFunctions_1.getReplacementSetsForItem(item);
        // SMS 전송 => Buyer에게 전송
        await ItemSmsFunctions_1.SendSmsWithTriggerEvent({
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
            await ItemSmsFunctions_1.SendSmsWithTriggerEvent({
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
const resolvers = {
    Mutation: {
        ConfirmItemPayment: resolverFuncWrapper_1.defaultResolver(exports.ConfirmItemPaymentFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=ConfirmItemPayment.resolvers.js.map