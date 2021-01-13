"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.denyItems = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const Store_1 = require("../../../models/Store/Store");
const Product_1 = require("../../../models/Product/Product");
const User_1 = require("../../../models/User");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
const CancelItemTransaction_1 = require("../shared/CancelItemTransaction");
exports.denyItems = async ({ args, context: { req } }) => {
    var _a;
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { param } = args;
        const item = await Item_1.ItemModel.findById(param.itemId);
        if (!item) {
            throw new apollo_server_1.ApolloError("존재하지 않는 Item 입니다", values_1.ERROR_CODES.UNEXIST_ITEM, {
                loc: "CancelItem",
                data: {
                    item,
                    cognitoUser
                }
            });
        }
        const store = await Store_1.StoreModel.findById(item.storeId);
        if (!store) {
            throw new apollo_server_1.ApolloError("존재하지 않는 Store", values_1.ERROR_CODES.UNEXIST_STORE, {
                loc: "CancelItem",
                data: {
                    store,
                    item,
                    cognitoUser
                }
            });
        }
        await item
            .applyStatus("CANCELED", {
            workerId: cognitoUser._id
        })
            .save({ session });
        await CancelItemTransaction_1.cancelTransaction(item, param.refundParams, session);
        await item.save({ session });
        const product = await Product_1.ProductModel.findById(item.productId);
        if (!product) {
            throw new apollo_server_1.ApolloError("존재하지 않을리 없는 ProductId", values_1.ERROR_CODES.UNEXIST_PRODUCT);
        }
        const smsKey = (_a = (await User_1.UserModel.findById(cognitoUser._id).session(session))) === null || _a === void 0 ? void 0 : _a.smsKey;
        // trigger검색: Event & tags 검색(storeId)
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
                        receivers: [item.phoneNumber.replace("+82", "")],
                        replacementSets: await ItemSmsFunctions_1.getReplacementSetsForItem(item)
                    }
                ]
            });
        }
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: item
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        CancelItem: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.denyItems))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CancelItem.resolvers.js.map