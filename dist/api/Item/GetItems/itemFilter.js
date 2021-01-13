"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFilterQuery = void 0;
const dateFuncs_1 = require("../../../utils/dateFuncs");
const mongodb_1 = require("mongodb");
const DateTimeRange_1 = require("../../../utils/DateTimeRange");
exports.makeFilterQuery = (filter, offset) => {
    const query = {};
    if (filter.date) {
        const nDate = new Date(filter.date.getTime() - offset * dateFuncs_1.ONE_HOUR);
        query["dateTimeRange.to"] = {
            $gte: nDate
        };
        query["dateTimeRange.from"] = {
            $lte: new Date(nDate.getTime() + dateFuncs_1.ONE_DAY)
        };
    }
    if (filter.dateTimeRange) {
        const dateTimeRangeCls = new DateTimeRange_1.DateTimeRangeCls(filter.dateTimeRange);
        query["dateTimeRange.to"] = {
            $gt: dateTimeRangeCls.from
        };
        query["dateTimeRange.from"] = {
            $lt: dateTimeRangeCls.to
        };
    }
    if (filter.createdAtRange) {
        const rangeCls = new DateTimeRange_1.DateTimeRangeCls(filter.createdAtRange);
        query["createdAt"] = {
            $gte: rangeCls.from,
            $lt: rangeCls.to
        };
    }
    if (filter.name) {
        query.name = new RegExp(filter.name);
    }
    if (filter.productId) {
        query.productId = new mongodb_1.ObjectId(filter.productId);
    }
    console.log(filter.status);
    if (filter.status) {
        query.status = filter.status;
    }
    return query;
};
//# sourceMappingURL=itemFilter.js.map