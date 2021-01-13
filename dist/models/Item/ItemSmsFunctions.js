"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendSmsWithTriggerEvent = exports.getReplacementSetsForItem = void 0;
const Product_1 = require("../Product/Product");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../types/values");
const dateFuncs_1 = require("../../utils/dateFuncs");
const requestSmsApi_1 = require("../../utils/requestSmsApi");
const graphql_1 = require("graphql");
const Store_1 = require("../Store/Store");
exports.getReplacementSetsForItem = async (item) => {
    const product = await Product_1.ProductModel.findById(item.productId);
    if (!product) {
        throw new apollo_server_1.ApolloError("존재하지 않는 ProductId", values_1.ERROR_CODES.UNEXIST_PRODUCT);
    }
    const offset = product.periodOption.offset;
    const { start, end, dateTimeRange } = getStartEnd(item.dateTimeRange.from, item.dateTimeRange.to, offset);
    const store = await Store_1.StoreModel.findById(product.storeId);
    const replacements = {
        ITEM_CODE: item.code,
        ITEM_END: end,
        ITEM_START: start,
        ITEM_DATETIME_RANGE: dateTimeRange,
        ITEM_INTERVAL: item.dateTimeRange.interval + "분",
        ITEM_NAME: item.name,
        ITEM_STATUS: item.status,
        ITEM_ORDERCOUNT: item.orderCount + "개",
        PRODUCT_NAME: product.name,
        MANAGER_PHONENUMBER: store === null || store === void 0 ? void 0 : store.manager.phoneNumber,
        MANAGER_NAME: store === null || store === void 0 ? void 0 : store.manager.name
    };
    const result = [];
    for (const key in replacements) {
        const value = replacements[key];
        result.push({
            key: key,
            value
        });
    }
    return result;
};
const getStartEnd = (from, to, offset) => {
    const start = new Date(from.getTime() + offset * dateFuncs_1.ONE_HOUR);
    const end = new Date(to.getTime() + offset * dateFuncs_1.ONE_HOUR);
    const isSameDate = start.getTime() - end.getTime() < dateFuncs_1.ONE_DAY;
    return {
        start: dateStrFormat(start),
        end: dateStrFormat(end),
        dateTimeRange: isSameDate
            ? `${dateStrFormat(start)} ~ ${end.toISOString().substr(11, 5)}`
            : `${dateStrFormat(start)} ~ ${dateStrFormat(end)}`
    };
};
const dateStrFormat = (date) => {
    return date
        .toISOString()
        .substr(0, 16)
        .replace("T", " ");
};
exports.SendSmsWithTriggerEvent = async ({ event, recWithReplSets, smsKey, tags }) => {
    const sendResult = 
    // const queryResult =
    await requestSmsApi_1.requestApi(process.env.SMS_API_EDGE || "", graphql_1.print(apollo_server_1.gql `
                mutation SendWithEvent(
                    $event: String!
                    $tags: [TagInput!]!
                    $recWithReplSets: [ReceiverWithReplacementSetsInput!]!
                ) {
                    SendWithEvent(
                        event: $event
                        tags: $tags
                        receiverWithReplacementSets: $recWithReplSets
                    ) {
                        ok
                        errors
                        data {
                            _id
                            amount
                            description
                            isRefunded
                            itemType
                            aligoMid
                            type
                            receivers
                            successCount
                            errorCount
                        }
                    }
                }
            `), {
        event,
        tags,
        recWithReplSets
    }, {
        smsKey
    });
    return sendResult;
};
//# sourceMappingURL=ItemSmsFunctions.js.map