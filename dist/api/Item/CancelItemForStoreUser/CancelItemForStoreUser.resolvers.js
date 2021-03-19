"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelItemForStoreUserFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const Store_1 = require("../../../models/Store/Store");
const User_1 = require("../../../models/User");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
const Product_1 = require("../../../models/Product/Product");
const transactionFuncs_1 = require("../../../models/Transaction/transactionFuncs");
exports.CancelItemForStoreUserFunc = async ({ args, context: { req } }) => {
    console.log("-=============CancelItemForStoreUserFunc call!==========");
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser } = req;
        const { comment, itemCode } = args;
        const item = await Item_1.ItemModel.findByCode(itemCode);
        if (!item.storeUserId.equals(storeUser._id)) {
            throw new apollo_server_1.ApolloError("해당 Item에 대한 사용 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_ITEM);
        }
        await item
            .applyStatus("CANCELED", {
            comment: comment || undefined
        })
            .save({ session });
        // 문자를 보내야 하는데... 문자를 보내려면 관리자의 smsKey를 알아야함. 이하 그 과정임.
        const product = await Product_1.ProductModel.findById(item.productId);
        const store = (product === null || product === void 0 ? void 0 : product.storeId) ? await Store_1.StoreModel.findById(product.storeId)
            : undefined;
        const user = await User_1.UserModel.findById(store === null || store === void 0 ? void 0 : store.userId);
        if (!user) {
            throw new apollo_server_1.ApolloError("존재하지 않는 UserId", values_1.ERROR_CODES.UNEXIST_USER);
        }
        await sendSms(item, user.smsKey);
        console.log(typeof sendSms);
        console.log("sendSms 전송 안되서 당분간 사용 x");
        // TODO: Item.refundStatus = PENDING 으로 만들어야함.
        if (item.transactionId) {
            const transaction = await transactionFuncs_1.findTransaction(item.transactionId);
            // TODO. paymentStatus = Pending 인 경우, setTransactionRefundStatusToDone 추가
            if (transaction.paymentStatus === "DONE") {
                transactionFuncs_1.setTransactionRefundStatusToPending(transaction, {
                    amount: 0,
                    paymethod: "CARD",
                    currency: "KRW"
                });
            }
            else if (transaction.paymentStatus === "PENDING") {
                transactionFuncs_1.setTransactionPayStatusToCanceled(transaction, {
                    currency: "KRW",
                    amount: transaction.amountInfo.origin,
                    paymethod: "CARD",
                    message: comment || undefined
                });
            }
            await transaction.save({ session });
        }
        await item.save({ session });
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
const sendSms = async (item, smsKey) => {
    if (smsKey && item.phoneNumber) {
        // Send for buyer
        const tags = [
            {
                key: "storeId",
                value: item.storeId.toHexString()
            }
        ];
        const event = "ITEM_CANCELED";
        // SMS 전송
        await ItemSmsFunctions_1.SendSmsWithTriggerEvent({
            smsKey,
            event,
            tags,
            recWithReplSets: [
                {
                    receivers: [item.phoneNumber],
                    replacementSets: await ItemSmsFunctions_1.getReplacementSetsForItem(item)
                }
            ]
        });
    }
};
const resolvers = {
    Mutation: {
        CancelItemForStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.CancelItemForStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CancelItemForStoreUser.resolvers.js.map