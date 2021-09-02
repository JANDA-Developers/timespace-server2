import { DocumentType } from "@typegoose/typegoose";
import { ItemCls } from "./Item";
import { Replacements } from "../../types/types";
import {
    SmsTemplateAttributeSets,
    SmsTemplateKeyForItemUpsert,
    SmsTriggerEvent
} from "../../types/graph";
import { ProductModel } from "../Product/Product";
import { ApolloError, gql } from "apollo-server";
import { ERROR_CODES } from "../../types/values";
import { ONE_DAY, ONE_HOUR } from "../../utils/dateFuncs";
import _ from "lodash";
import { requestApi } from "../../utils/requestSmsApi";
import { print } from "graphql";
import { StoreModel } from "../Store/Store";

export const getReplacementSetsForItem = async (
    item: DocumentType<ItemCls>
): Promise<SmsTemplateAttributeSets[]> => {
    const product = await ProductModel.findById(item.productId);
    if (!product) {
        throw new ApolloError(
            "존재하지 않는 ProductId",
            ERROR_CODES.UNEXIST_PRODUCT
        );
    }

    const offset = product.periodOption.offset;
    const { start, end, dateTimeRange } = getStartEnd(
        item.dateTimeRange.from,
        item.dateTimeRange.to,
        offset
    );
    const store = await StoreModel.findById(product.storeId);
    const replacements: Replacements = {
        ITEM_CODE: item.code,
        ITEM_END: end,
        ITEM_START: start,
        ITEM_DATETIME_RANGE: dateTimeRange,
        ITEM_INTERVAL: item.dateTimeRange.interval + "분",
        ITEM_NAME: item.name,
        ITEM_STATUS: item.status,
        ITEM_ORDERCOUNT: item.orderCount + "개",
        PRODUCT_NAME: product.name,
        MANAGER_PHONENUMBER: store?.manager.phoneNumber,
        MANAGER_NAME: store?.manager.name
    };
    const result: SmsTemplateAttributeSets[] = [];

    for (const key in replacements) {
        const value = replacements[key];
        result.push({
            key: key as SmsTemplateKeyForItemUpsert,
            value
        });
    }
    return result;
};

const getStartEnd = (
    from: any,
    to: any,
    offset: number
): { start: string; end: string; dateTimeRange: string } => {
    const start = new Date(from.getTime() + offset * ONE_HOUR);
    const end = new Date(to.getTime() + offset * ONE_HOUR);
    const isSameDate = start.getTime() - end.getTime() < ONE_DAY;

    return {
        start: dateStrFormat(start),
        end: dateStrFormat(end),
        dateTimeRange: isSameDate
            ? `${dateStrFormat(start)} ~ ${end.toISOString().substr(11, 5)}`
            : `${dateStrFormat(start)} ~ ${dateStrFormat(end)}`
    };
};

const dateStrFormat = (date: Date) => {
    return date
        .toISOString()
        .substr(0, 16)
        .replace("T", " ");
};

let sendChange = 1;
export const SendSmsWithTriggerEvent = async ({
    event,
    recWithReplSets,
    smsKey,
    tags
}: {
    smsKey: string;
    event: SmsTriggerEvent;
    tags: { key: string; value: string }[];
    recWithReplSets: {
        receivers: string[];
        replacementSets: SmsTemplateAttributeSets[];
    }[];
}) => {
    console.count("HowManyTime" + event);
    console.log("Send Start");
    console.log(sendChange);
    sendChange -= 1;
    console.log(recWithReplSets?.[0]?.receivers);
    const sendResult =
        // const queryResult =
        await requestApi(
            process.env.SMS_API_EDGE || "",
            print(gql`
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
            `),
            {
                event,
                tags,
                recWithReplSets
            },
            {
                smsKey
            }
        );
    console.log("Send End");
    return sendResult;
};
