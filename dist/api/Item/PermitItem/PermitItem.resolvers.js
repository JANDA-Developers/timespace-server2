"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const mongodb_1 = require("mongodb");
const Product_1 = require("../../../models/Product/Product");
const User_1 = require("../../../models/User");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
const DateTimeRange_1 = require("../../../utils/DateTimeRange");
const resolvers = {
    Mutation: {
        PermitItem: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args, context: { req } }) => {
            var _a;
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { param } = args;
                const item = await Item_1.ItemModel.findById(param.itemId);
                if (!item) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 ItemId", values_1.ERROR_CODES.UNEXIST_ITEM, {
                        loc: "PermitItem",
                        param,
                        user: cognitoUser,
                        item
                    });
                }
                const product = await Product_1.ProductModel.findById(item.productId);
                if (!product) {
                    throw new apollo_server_1.ApolloError("존재하지 않을리 없는 ProductId", values_1.ERROR_CODES.UNEXIST_PRODUCT);
                }
                await item
                    .applyStatus("PERMITTED", {
                    workerId: new mongodb_1.ObjectId(cognitoUser._id),
                    comment: param.comment || undefined
                })
                    .save({
                    session
                });
                await checkDuplicate(item, product);
                await item.save({
                    session
                });
                // 취소 로직 ㄱㄱ
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
                    const event = "ITEM_PERMITTED";
                    // SMS 전송
                    await ItemSmsFunctions_1.SendSmsWithTriggerEvent({
                        smsKey,
                        event,
                        tags,
                        recWithReplSets: [
                            {
                                receivers: [
                                    item.phoneNumber.replace("+82", "")
                                ],
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
        }))
    }
};
const checkDuplicate = async (item, product) => {
    const dateTimeRange = item.dateTimeRange;
    const list = await product.getSegmentSchedules(new DateTimeRange_1.DateTimeRangeCls(dateTimeRange));
    if (list.length === 0) {
        throw new apollo_server_1.ApolloError("이용 가능한 시간이 아닙니다.", values_1.ERROR_CODES.UNAVAILABLE_BUSINESSHOURS);
    }
    const isAvailable = list.map(l => !l.soldOut).filter(t => t).length === list.length;
    if (!isAvailable) {
        throw new apollo_server_1.ApolloError("인원 초과로 해당 예약을 승인할 수 없습니다.", values_1.ERROR_CODES.UNAVAILABLE_SOLD_OUT, {
            segment: list
        });
    }
};
exports.default = resolvers;
//# sourceMappingURL=PermitItem.resolvers.js.map