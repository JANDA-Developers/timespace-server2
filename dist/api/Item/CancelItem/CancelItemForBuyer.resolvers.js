"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Item_1 = require("../../../models/Item/Item");
const mongodb_1 = require("mongodb");
const User_1 = require("../../../models/User");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const Product_1 = require("../../../models/Product/Product");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
const resolvers = {
    Mutation: {
        CancelItemForBuyer: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForBuyer(async ({ args, context: { req } }) => {
            var _a;
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoBuyer } = req;
                const { param } = args;
                // TODO: 렛츠고 ㄱㄱ
                const item = await Item_1.ItemModel.findByCode(param.itemCode);
                await item
                    .applyStatus("CANCELED", {
                    comment: param.comment || undefined,
                    workerId: new mongodb_1.ObjectId(cognitoBuyer._id)
                })
                    .save({ session });
                await item.save({ session });
                const product = await Product_1.ProductModel.findById(item.productId);
                if (!product) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Product", values_1.ERROR_CODES.UNEXIST_PRODUCT);
                }
                const seller = await User_1.UserModel.findById(product.userId);
                if (!seller) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Seller", values_1.ERROR_CODES.UNAUTHORIZED_USER);
                }
                const smsKey = (_a = (await User_1.UserModel.findById(product.userId).session(session))) === null || _a === void 0 ? void 0 : _a.smsKey;
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
                                receivers: [item.phoneNumber],
                                replacementSets: await ItemSmsFunctions_1.getReplacementSetsForItem(item)
                            }
                        ]
                    });
                }
                await session.commitTransaction();
                session.endSession();
                // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ
                return {
                    ok: true,
                    error: null,
                    data: item
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CancelItemForBuyer.resolvers.js.map