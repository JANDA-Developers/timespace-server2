"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.offsetDate = exports.removeHours = exports.dateDistance = exports.dateToMinutes = exports.getDayOfYear = exports.convertStrToDateObj = exports.getDateString = exports.getDateArr = exports.dayOfYear = exports.ONE_YEAR = exports.ONE_DAY = exports.ONE_HOUR = exports.ONE_MINUTE = void 0;
const lodash_1 = __importDefault(require("lodash"));
exports.ONE_MINUTE = 1000 * 60;
exports.ONE_HOUR = exports.ONE_MINUTE * 60;
exports.ONE_DAY = exports.ONE_HOUR * 24;
exports.ONE_YEAR = exports.ONE_DAY * 365;
// 1년중 몇째 날인지 계산 ㄱㄱ
exports.dayOfYear = (cur) => {
    const start = new Date(cur.getFullYear(), 0, 0);
    const diff = cur.getTime() -
        start.getTime() +
        (start.getTimezoneOffset() - cur.getTimezoneOffset()) * 60 * 1000;
    return Math.floor(diff / exports.ONE_DAY);
};
exports.getDateArr = (start, end) => {
    const interval = (end.getTime() - start.getTime()) / exports.ONE_DAY;
    const time = start.getTime();
    const result = [start];
    for (let i = 1; i < interval; i++) {
        const temp = new Date(time + exports.ONE_DAY * i);
        result.push(temp);
    }
    return result;
};
exports.getDateString = (date, timezoneOffset) => {
    return new Date(date.getTime() - (timezoneOffset || 0) * exports.ONE_MINUTE)
        .toISOString()
        .split(".")[0]
        .replace(/[-:TZ.]/gi, "")
        .substring(0, 12);
};
exports.convertStrToDateObj = (dateStr) => {
    const temp = dateStr.replace(/[-.:TZ]/g, "").substr(0, 14);
    if (temp.length < 8) {
        return new Date();
    }
    const y = parseInt(temp.substr(0, 4));
    const excY = lodash_1.default.chunk(temp.substr(4), 2).map(s => parseInt(s.join("")));
    return new Date(y, excY[0] - 1 || 0, excY[1] || 0, ...excY.splice(2));
};
exports.getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() -
        start.getTime() +
        (start.getTimezoneOffset() - date.getTimezoneOffset()) * exports.ONE_MINUTE;
    return Math.floor(diff / exports.ONE_DAY);
};
exports.dateToMinutes = (dateTime, date) => {
    const nDate = new Date((date || dateTime).getTime());
    nDate.setTime(nDate.getTime() - (nDate.getTime() % exports.ONE_DAY));
    return Math.floor((dateTime.getTime() - nDate.getTime()) / exports.ONE_MINUTE);
};
exports.dateDistance = (target, st) => {
    return Math.floor((target.getTime() - st.getTime()) / exports.ONE_MINUTE);
};
exports.removeHours = (date) => {
    const time = date.getTime();
    return new Date(time - (time % exports.ONE_DAY));
};
exports.offsetDate = (date, offset) => date.setTime(date.getTime() - offset * 60 * 60000);
//# sourceMappingURL=dateFuncs.js.map