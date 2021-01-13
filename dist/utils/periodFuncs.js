"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePeriod = exports.validatePeriodWithDays = exports.divideDateTimeRange = exports.getDateTimeRangeFromPeriodList = exports.setPeriodToDB = exports.getPeriodFromDB = exports.daysNumToArr = exports.daysToNumber = exports.splitPeriods = exports.mergePeriods = void 0;
const Period_1 = require("./Period");
const lodash_1 = __importDefault(require("lodash"));
const values_1 = require("../types/values");
exports.mergePeriods = (periods, offset) => {
    const sortedPeriod = lodash_1.default.sortBy(periods, [o => o.start, o => o.end]);
    const temp = sortedPeriod[0];
    const result = [
        {
            start: temp.start,
            end: temp.end,
            time: temp.time,
            days: temp.day,
            offset: offset * 60
        }
    ];
    if (sortedPeriod.length > 1) {
        for (let idx = 1; idx < sortedPeriod.length; idx++) {
            const element = sortedPeriod[idx];
            const lastOne = result[result.length - 1];
            if (element.isSameTime(lastOne)) {
                lastOne.days = lastOne.days | element.day;
            }
            else {
                result.push({
                    start: element.start,
                    end: element.end,
                    time: element.time,
                    days: element.day,
                    offset: offset * 60
                });
            }
        }
    }
    return result;
};
exports.splitPeriods = (periods, offset) => {
    const result = periods.map(p => {
        if (typeof p.days === "number") {
            return exports.daysNumToArr(p.days).map((day) => {
                return new Period_1.PeriodCls({
                    ...p,
                    day,
                    offset: offset * 60
                });
            });
        }
        else {
            return p.days.map((day) => {
                return new Period_1.PeriodCls({
                    ...p,
                    day: typeof day === "string" ? values_1.DayEnum[day] : day,
                    offset: offset * 60
                });
            });
        }
    });
    return lodash_1.default.flatMap(result);
};
exports.daysToNumber = (days) => {
    return days.reduce((d1, d2) => d1 | d2);
};
exports.daysNumToArr = (day, criteria = 64) => {
    if (criteria === 0) {
        return [];
    }
    if (day >= criteria) {
        const v = exports.daysNumToArr(day - criteria, criteria >> 1);
        v.push(criteria);
        return v;
    }
    else {
        return exports.daysNumToArr(day, criteria >> 1);
    }
};
exports.getPeriodFromDB = (periodArr, offset) => {
    const result = exports.mergePeriods(periodArr.map(p => new Period_1.PeriodCls({
        ...p
    })), offset);
    return result;
};
exports.setPeriodToDB = (periodArr, offset) => {
    if (!periodArr.length) {
        return [];
    }
    return exports.splitPeriods(periodArr.map((p) => {
        return {
            days: p.days,
            time: p.time,
            start: p.start,
            end: p.end,
            offset
        };
    }), offset);
};
/**
 * 어떤 날짜에 몇시~몇시 까지 영업하는지 알아낼때 사용하는 함수.
 * 퍼포먼스는 보장 못함. ㅜ
 * @param periodArr PeriodWithDays 배열
 * @param date 날짜 => Hours 이하 필드들은 0으로 set한 뒤에 사용됨
 * @param offset
 */
exports.getDateTimeRangeFromPeriodList = (periodArr, date, offset) => {
    const periodList = exports.splitPeriods(periodArr, offset);
    // 왜 2개가 나옴?
    const dateRanges = periodList
        .map(period => {
        try {
            return period.toDateTimeRange(date);
        }
        catch (error) {
            return undefined;
        }
    })
        .filter(v => v);
    return dateRanges[0];
};
exports.divideDateTimeRange = (dateTimeRange, unit) => {
    const { from, to } = {
        from: new Date(dateTimeRange.from.getTime()),
        to: dateTimeRange.to
    };
    const segmentList = [];
    while (to.getTime() > from.getTime()) {
        segmentList.push({
            from: new Date(from.getTime()),
            to: new Date(from.setTime(from.getTime() + unit * 60000))
        });
    }
    return segmentList;
};
exports.validatePeriodWithDays = (periodWithDays) => {
    // 1. 요일이 겹치는지 확인
    // 2. offset이 일정하게 들어갔는지 확인
    let isDuplicate = false;
    periodWithDays
        .map(p => {
        return p.days;
    })
        .forEach((days, idx, list) => {
        for (let i = idx + 1; i < list.length; i++) {
            if (!isDuplicate && (days & list[i]) !== 0) {
                isDuplicate = true;
                return;
            }
        }
    });
    return isDuplicate;
};
exports.validatePeriod = (periodList) => {
    let isDuplicate = false;
    periodList
        .map((p) => {
        return p.day;
    })
        .reduce((days, day) => {
        const temp = days | day;
        if (days === temp) {
            isDuplicate = true;
        }
        return temp;
    });
    return !isDuplicate;
};
//# sourceMappingURL=periodFuncs.js.map