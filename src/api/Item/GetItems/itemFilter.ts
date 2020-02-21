import { GetItemsFilterInput } from "../../../types/graph";
import { Minute } from "../../../types/values";
import { ONE_DAY, ONE_HOUR } from "../../../utils/dateFuncs";
import { ObjectId } from "mongodb";

export const makeFilterQuery = (
    filter: GetItemsFilterInput,
    offset: Minute
): any => {
    const query: any = {};
    if (filter.date) {
        const nDate = new Date(filter.date.getTime() - offset * ONE_HOUR);
        query["dateTimeRange.to"] = {
            $gt: nDate
        };
        query["dateTimeRange.from"] = {
            $lt: new Date(nDate.getTime() + ONE_DAY)
        };
    }
    if (filter.name) {
        query.name = new RegExp(filter.name);
    }
    if (filter.productId) {
        query.productId = new ObjectId(filter.productId);
    }
    return query;
};
