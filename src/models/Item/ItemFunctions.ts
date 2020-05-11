import { DocumentType } from "@typegoose/typegoose";
import { ItemCls } from "./Item";
import { Replacements } from "../../types/types";
import {
    SmsTemplateAttributeSets,
    SmsTemplateKeyForItemUpsert
} from "../../types/graph";
import { ProductModel } from "../Product/Product";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../types/values";
import { ONE_MINUTE, ONE_DAY } from "../../utils/dateFuncs";
import _ from "lodash";

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
    const replacements: Replacements = {
        ITEM_CODE: item.code,
        ITEM_END: end,
        ITEM_START: start,
        ITEM_DATETIME_RANGE: dateTimeRange,
        ITEM_INTERVAL: item.dateTimeRange.interval + "분",
        ITEM_NAME: item.name,
        ITEM_STATUS: item.status,
        ITEM_ORDERCOUNT: item.orderCount + "개",
        PRODUCT_NAME: product.name
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
    const start = new Date(from.getTime() + offset * ONE_MINUTE);
    const end = new Date(to.getTime() + offset * ONE_MINUTE);
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
