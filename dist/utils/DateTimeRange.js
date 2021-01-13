"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimeRangeCls = void 0;
const dateFuncs_1 = require("./dateFuncs");
class DateTimeRangeCls {
    constructor(param) {
        const { from, to } = {
            from: new Date(param.from),
            to: new Date(param.to)
        };
        this.from = from;
        this.to = to;
        this.interval = Math.floor((this.to.getTime() - this.from.getTime()) / dateFuncs_1.ONE_MINUTE);
    }
}
exports.DateTimeRangeCls = DateTimeRangeCls;
//# sourceMappingURL=DateTimeRange.js.map