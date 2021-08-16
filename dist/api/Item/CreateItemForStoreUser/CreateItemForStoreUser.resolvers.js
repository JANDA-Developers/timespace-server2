"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkVerification = exports.CreateItemForStoreUserFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const Item_1 = require("../../../models/Item/Item");
const Product_1 = require("../../../models/Product/Product");
const DateTimeRange_1 = require("../../../utils/DateTimeRange");
const dateFuncs_1 = require("../../../utils/dateFuncs");
const mongodb_1 = require("mongodb");
const s3Funcs_1 = require("../../../utils/s3Funcs");
const Store_1 = require("../../../models/Store/Store");
const User_1 = require("../../../models/User");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
const transactionFuncs_1 = require("../../../models/Transaction/transactionFuncs");
exports.CreateItemForStoreUserFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        console.log("------------CreateItemForStoreUserFunc call!!=========");
        const { storeUser } = req;
        const { dateTimeRange, productCode, usersInput } = args;
        // product = undefined 인 경우 에러나면서 종료됨.
        const product = await Product_1.ProductModel.findByCode(productCode);
        console.log({
            usingPayment: product.usingPayment,
            product
        });
        if (!product.needToPermit) {
            console.log("------------validateDateTimeRange call!!=========");
            await validateDateTimeRange(product, dateTimeRange);
            console.log("------------validateDateTimeRange endll!!=========");
        }
        const store = await Store_1.StoreModel.findById(product.storeId);
        if (!store) {
            throw new Error("존재하지 않는 Store");
        }
        console.log("------------checkVerification call!!=========");
        exports.checkVerification(store, storeUser);
        console.log("------------createItem call!!=========");
        const item = await createItem(storeUser, store, product, dateTimeRange, usersInput, session);
        console.log("------------item=========");
        console.log(item);
        await session.commitTransaction();
        session.endSession();
        console.log("------------return=========");
        console.log({
            ok: true,
            error: null,
            data: item
        });
        return {
            ok: true,
            error: null,
            data: item
        };
    }
    catch (error) {
        console.log("----------catch cal!!!!!!---------");
        console.log(error);
        return await utils_1.errorReturn(error, session);
    }
};
exports.checkVerification = async (store, storeUser) => {
    const storeVerificationPolicy = {
        phoneVerification: store.signUpOption.usePhoneVerification,
        emailVerification: store.signUpOption.useEmailVerification
    };
    const phoneVerified = storeVerificationPolicy.phoneVerification &&
        !storeUser.verifiedPhoneNumber;
    const emailVerified = storeVerificationPolicy.emailVerification && !storeUser.verifiedEmail;
    console.log({
        storeVerificationPolicy,
        phoneVerified,
        emailVerified
    });
    if (phoneVerified) {
        throw new apollo_server_1.ApolloError("전화번호 인증이 되지 않은 User 입니다. 인증후 사용해 주세요.", values_1.ERROR_CODES.UNAUTHORIZED_STORE_USER);
    }
    if (emailVerified) {
        throw new apollo_server_1.ApolloError("전화번호 인증이 되지 않은 User 입니다. 인증후 사용해 주세요.", values_1.ERROR_CODES.UNAUTHORIZED_STORE_USER);
    }
};
const createItem = async (storeUser, store, product, dateTimeRange, usersInput, session) => {
    if (!usersInput.privacyPolicyAgreement) {
        throw new apollo_server_1.ApolloError("개인정보 활용동의 체크 필수", values_1.ERROR_CODES.INVALID_VALUES);
    }
    const item = new Item_1.ItemModel();
    item.productId = product._id;
    item.name = usersInput.name || storeUser.name;
    item.phoneNumber = usersInput.phoneNumber || storeUser.phoneNumber;
    item.storeId = product.storeId;
    item.storeUserId = storeUser._id;
    // set DateTimeRange
    const { from, to } = dateTimeRange;
    item.dateTimeRange = {
        from,
        to,
        interval: Math.floor((to.getTime() - from.getTime()) / dateFuncs_1.ONE_MINUTE)
    };
    // await item.setStatusForDefault();
    // 통과 못하면 여기서 에러냄
    // HACK: 오류있을 가능성 오짐.
    item.customFieldValues = (await getItemsCustomFieldValues({
        customFields: usersInput.customFieldValues,
        customFieldDef: store.customFields,
        itemCode: item.code
    }));
    await item.setCode(product.code, new Date());
    await item
        .applyStatus(product.needToConfirm ? "PENDING" : "PERMITTED", {})
        .save({ session });
    if (product.usingPayment &&
        (product.segmentPrice != 0 || product.defaultPrice != 0)) {
        const transaction = setTransaction({
            product,
            item,
            storeUser
        });
        await transaction.save({ session });
        item.transactionId = transaction._id;
    }
    // SMS 전송 ㄱㄱㄱ
    if (!product.usingPayment) {
        // 결제가 이루어지는 경우 ConfirmItem에서 문자를 전송한다.
        await SendSmsForStoreUser(product, item);
        // console.log(typeof SendSmsForStoreUser);
        // console.log("====403에러떄문에 문자는 잠시안보내기로 ===");
    }
    await item.save({ session });
    return item;
};
const setTransaction = ({ product, item, storeUser }) => {
    const { defaultPrice, segmentPrice, periodOption: { unit } } = product;
    const { dateTimeRange: { interval } } = item;
    // 아이템 수량
    const itemCount = Math.floor(interval / unit);
    const defaultCount = Math.floor(product.periodOption.min / unit);
    const additionalCount = itemCount - defaultCount;
    // 최종 아이템 가격
    const amount = (defaultPrice || defaultCount * segmentPrice) +
        additionalCount * segmentPrice;
    const transaction = transactionFuncs_1.createTransaction({
        amount,
        paymethod: "CARD",
        itemId: item._id,
        sellerId: product.userId,
        storeId: product.storeId,
        storeUserId: storeUser._id,
        // TODO: 통화 단위 관련
        currency: "KRW"
    });
    return transaction;
};
const getItemsCustomFieldValues = async ({ customFields, itemCode, customFieldDef }) => {
    const findField = (fields, key) => {
        return fields.find(f => f.key.equals(key));
    };
    if (!customFieldDef) {
        return [];
    }
    if (!customFields) {
        const haveMandatoryField = customFieldDef.map(def => def.isMandatory).filter(t => t).length >
            0;
        if (haveMandatoryField) {
            throw new apollo_server_1.ApolloError("필수 사용자 정의 필드가 입력되지 않았습니다.", values_1.ERROR_CODES.INVALID_VALUES);
        }
        return [];
    }
    const result = await Promise.all(customFields.map(async (f) => {
        const ff = findField(customFieldDef, new mongodb_1.ObjectId(f.key));
        if (!ff) {
            return undefined;
        }
        let url = "";
        if (f.file) {
            const file = await f.file;
            url = (await s3Funcs_1.uploadFile(file, {
                dir: `buyer/${itemCode}`
            })).url;
        }
        return {
            key: new mongodb_1.ObjectId(f.key),
            label: ff.label,
            type: ff.type,
            value: f.value || url
        };
    }));
    return result;
};
const validateDateTimeRange = async (product, dateTimeRange) => {
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
        const isAvailable = list.map(l => !l.soldOut).filter(t => t).length === list.length;
        if (!isAvailable) {
            throw new apollo_server_1.ApolloError("SoldOut인 Segment가 존재합니다.", values_1.ERROR_CODES.UNAVAILABLE_SOLD_OUT, {
                segment: list
            });
        }
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
        CreateItemForStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.CreateItemForStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CreateItemForStoreUser.resolvers.js.map