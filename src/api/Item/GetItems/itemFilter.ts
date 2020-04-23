import { GetItemsFilterInput } from "GraphType";
import { Minute } from "../../../types/values";
import { ONE_DAY, ONE_HOUR } from "../../../utils/dateFuncs";
import { ObjectId } from "mongodb";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";

export const makeFilterQuery = (
    filter: GetItemsFilterInput,
    offset: Minute
): any => {
    const query: any = {};
    if (filter.date) {
        const nDate = new Date(filter.date.getTime() - offset * ONE_HOUR);
        query["dateTimeRange.to"] = {
            $gte: nDate
        };
        query["dateTimeRange.from"] = {
            $lte: new Date(nDate.getTime() + ONE_DAY)
        };
    }
    if (filter.dateTimeRange) {
        const dateTimeRangeCls = new DateTimeRangeCls(filter.dateTimeRange);

        query["dateTimeRange.to"] = {
            $gt: dateTimeRangeCls.from
        };
        query["dateTimeRange.from"] = {
            $lt: dateTimeRangeCls.to
        };
    }
    if (filter.createdAtRange) {
        const rangeCls = new DateTimeRangeCls(filter.createdAtRange);

        query["createdAt"] = {
            $gte: rangeCls.from,
            $lt: rangeCls.to
        };
    }
    if (filter.name) {
        query.name = new RegExp(filter.name);
    }
    if (filter.productId) {
        query.productId = new ObjectId(filter.productId);
    }
    console.log(filter.status);
    if (filter.status) {
        query.status = filter.status;
    }
    return query;
};
