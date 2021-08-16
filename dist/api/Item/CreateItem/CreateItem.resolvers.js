"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Product_1 = require("../../../models/Product/Product");
const Item_1 = require("../../../models/Item/Item");
const dateFuncs_1 = require("../../../utils/dateFuncs");
const mongodb_1 = require("mongodb");
const DateTimeRange_1 = require("../../../utils/DateTimeRange");
const Store_1 = require("../../../models/Store/Store");
const User_1 = require("../../../models/User");
const s3Funcs_1 = require("../../../utils/s3Funcs");
const resolvers = {
    Mutation: {
        CreateItem: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args, context: { req } }, stack) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { param } = args;
                const now = new Date();
                const product = await Product_1.ProductModel.findById(param.productId);
                if (!product) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Product", values_1.ERROR_CODES.UNEXIST_PRODUCT);
                }
                const item = new Item_1.ItemModel();
                if (param.name && param.phoneNumber) {
                    item.memo = `${param.name} / ${param.phoneNumber}`;
                }
                if (param.dateTimeRange) {
                    const { from, to } = param.dateTimeRange;
                    item.dateTimeRange = {
                        from,
                        to,
                        interval: Math.floor((to.getTime() - from.getTime()) / dateFuncs_1.ONE_MINUTE)
                    };
                }
                const store = await Store_1.StoreModel.findById(product.storeId);
                if (!store) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 StoreId", values_1.ERROR_CODES.UNEXIST_STORE);
                }
                item.productId = product._id;
                item.storeId = product.storeId;
                item.userId = new mongodb_1.ObjectId(cognitoUser._id);
                await item
                    .applyStatus("PERMITTED", {
                    workerId: new mongodb_1.ObjectId(cognitoUser._id)
                })
                    .save({ session });
                await item.setCode(product.code, now);
                const customFieldDef = store.customFields;
                const customFieldValues = param.customFieldValues;
                const findField = (fields, key) => {
                    return fields.find(f => f.key.equals(key));
                };
                for (const fieldName in param) {
                    if (fieldName === "customFieldValues") {
                        item[fieldName] = (await Promise.all(customFieldValues.map(async (f) => {
                            const ff = findField(customFieldDef, new mongodb_1.ObjectId(f.key));
                            if (!ff) {
                                return undefined;
                            }
                            let url = null;
                            if (f.file && ff.type === "FILE") {
                                const file = await f.file;
                                url = (await s3Funcs_1.uploadFile(file, {
                                    dir: `buyer/${item.code}`
                                })).url;
                            }
                            return {
                                key: new mongodb_1.ObjectId(f.key),
                                label: ff.label,
                                type: ff.type,
                                value: f.value || url
                            };
                        }))).filter(t => t);
                    }
                    else {
                        const element = param[fieldName];
                        item[fieldName] = element;
                    }
                }
                // validation 필요함!
                // needConfirm
                const dateTimeRange = param.dateTimeRange;
                if (dateTimeRange) {
                    const list = await product.getSegmentSchedules(new DateTimeRange_1.DateTimeRangeCls(dateTimeRange));
                    console.log("============getSegmentSchedules 호출 완료!!=========");
                    console.log(list);
                    if (list.length === 0) {
                        throw new apollo_server_1.ApolloError("이용 가능한 시간이 아닙니다.", values_1.ERROR_CODES.UNAVAILABLE_BUSINESSHOURS);
                    }
                    const isAvailable = list.map(l => !l.soldOut).filter(t => t)
                        .length === list.length;
                    if (!isAvailable) {
                        throw new apollo_server_1.ApolloError("SoldOut인 Segment가 존재합니다.", values_1.ERROR_CODES.UNAVAILABLE_SOLD_OUT, {
                            segment: list
                        });
                    }
                }
                const seller = await User_1.UserModel.findById(product.userId);
                if (!seller) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 UserId", values_1.ERROR_CODES.UNEXIST_USER, {
                        errorInfo: "Product객체에 UserId 에러임"
                    });
                }
                // TODO 2020-05-17: 해당 시간에 예약이 가능한지 확인해야됨 ㅎ
                // TODO 2020-05-17: Trigger를 이용한 문자 전송
                await item.save({ session });
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
exports.default = resolvers;
//# sourceMappingURL=CreateItem.resolvers.js.map