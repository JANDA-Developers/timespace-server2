"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Item_1 = require("../../../models/Item/Item");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const Product_1 = require("../../../models/Product/Product");
const mongodb_1 = require("mongodb");
const dateFuncs_1 = require("../../../utils/dateFuncs");
const DateTimeRange_1 = require("../../../utils/DateTimeRange");
const Buyer_1 = require("../../../models/Buyer");
const Store_1 = require("../../../models/Store/Store");
const s3Funcs_1 = require("../../../utils/s3Funcs");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
const User_1 = require("../../../models/User");
const resolvers = {
    Mutation: {
        CreateItemForBuyer: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForBuyer(async ({ args, context: { req } }, stack) => {
            var _a;
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoBuyer } = req;
                const { param } = args;
                const buyer = await Buyer_1.BuyerModel.findBuyer(cognitoBuyer);
                const product = await Product_1.ProductModel.findByCode(param.productCode);
                const dateTimeRange = param.dateTimeRange;
                if (!dateTimeRange) {
                    throw new apollo_server_1.ApolloError("날짜 범위를 선택해 주세요", "PARAMETER_ERROR_DATETIMERANGE");
                }
                // Item 생성
                const item = await createItem(product, buyer, param);
                // Item Validation ㄱㄱ
                await validateDateTimerange(product, dateTimeRange);
                // Item 저장하기
                // TODO: 동작하는지 확인 ㄱㄱ
                await Promise.all([
                    // ChangeHistory 저장하는거임. Item저장 아님.
                    await item
                        .applyStatus(product.needToConfirm
                        ? "PENDING"
                        : "PERMITTED", {
                        workerId: product.needToConfirm
                            ? item.buyerId
                            : product.userId
                        // comment
                    })
                        .save({ session }),
                    await item.save({ session })
                ]);
                /*
                 * ========================================================================
                 *
                 *  SMS 전송 로직
                 *
                 * ========================================================================
                 */
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
const createItem = async (product, buyer, param) => {
    const item = new Item_1.ItemModel();
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
        throw new apollo_server_1.ApolloError("존재하지 않는 Store입니다(내부DB 에러)", values_1.ERROR_CODES.UNEXIST_STORE);
    }
    const { max, min } = store.periodOption;
    const overMax = item.dateTimeRange.interval > max;
    const lowerMin = item.dateTimeRange.interval < min;
    if (overMax || lowerMin) {
        throw new apollo_server_1.ApolloError(`${min}~${max}분 이내의 시간을 선택해 주세요`, values_1.ERROR_CODES.ITEM_VALIDATION_ERROR);
    }
    item.productId = product._id;
    item.storeId = product.storeId;
    item.buyerId = new mongodb_1.ObjectId(buyer._id);
    await item.setCode(product.code, new Date());
    const customFieldDef = store.customFields;
    await setParamsToItem(param, item, buyer, customFieldDef);
    return item;
};
const setParamsToItem = async (param, item, buyer, customFieldDef) => {
    // customField 확인 ㄱ
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
                let url = "";
                if (f.file) {
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
    if (!item.name) {
        item.name = buyer.name;
    }
    if (!item.phoneNumber) {
        item.phoneNumber = buyer.phone_number;
    }
};
const validateDateTimerange = async (product, dateTimeRange) => {
    if (dateTimeRange) {
        const dtRangeCls = new DateTimeRange_1.DateTimeRangeCls(dateTimeRange);
        const list = await product.getSegmentSchedules(dtRangeCls);
        if (list.length === 0) {
            throw new apollo_server_1.ApolloError("이용 가능한 시간이 아닙니다.", values_1.ERROR_CODES.UNAVAILABLE_BUSINESSHOURS);
        }
        // TODO: 여기서 걸러내자...
        const now = new Date();
        const interval = (dtRangeCls.from.getTime() - now.getTime()) / dateFuncs_1.ONE_DAY;
        if (product.bookingPolicy.limitFirstBooking > interval &&
            product.bookingPolicy.limitLastBooking < interval) {
            throw new apollo_server_1.ApolloError("예약 가능범위에 포함되지 않는 날짜입니다", values_1.ERROR_CODES.UNINCLUDED_BOOKING_DATERANGE);
        }
        const isAvailable = list.map(l => !l.soldOut).filter(t => t).length;
        if (!isAvailable) {
            throw new apollo_server_1.ApolloError("SoldOut인 Segment가 존재합니다.", values_1.ERROR_CODES.UNAVAILABLE_SOLD_OUT, {
                segment: list
            });
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=CreateItemForBuyer.resolvers.js.map