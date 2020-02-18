import { PeriodCls } from "./Period";
import _ from "lodash";
import { PeriodWithDays } from "./PeriodWithDays";
import { PeriodInput, Segment } from "../types/graph";
import { DayEnum } from "../types/values";
import { removeHours, ONE_MINUTE } from "./dateFuncs";
import { DateTimeRangeCls } from "./DateTimeRange";

export const isIncludePeriod = (
    periods: Array<PeriodCls>,
    targets: Array<PeriodCls>
) => {};

export const mergePeriods = (
    periods: Array<PeriodCls>
): Array<PeriodWithDays> => {
    const sortedPeriod = _.sortBy(periods, [o => o.start, o => o.end]);

    const temp = sortedPeriod[0];
    const result: Array<PeriodWithDays> = [
        {
            start: temp.start,
            end: temp.end,
            time: temp.time,
            days: temp.day
        }
    ];
    if (sortedPeriod.length > 1) {
        for (let idx = 1; idx < sortedPeriod.length; idx++) {
            const element = sortedPeriod[idx];
            const lastOne = result[result.length - 1];
            if (element.isSameTime(lastOne)) {
                lastOne.days = lastOne.days | element.day;
            } else {
                result.push({
                    start: element.start,
                    end: element.end,
                    time: element.time,
                    days: element.day
                });
            }
        }
    }
    console.log("MergePeriod ============================================");
    console.log(periods);
    console.log(result);
    console.log("MergePeriod End ========================================");
    return result;
};

export const splitPeriods = (
    periods: Array<PeriodWithDays | PeriodInput>
): Array<PeriodCls> => {
    const result = periods.map(p => {
        if (typeof p.days === "number") {
            return daysNumToArr(p.days).map(
                (day): PeriodCls => {
                    return new PeriodCls({
                        ...p,
                        day
                    });
                }
            );
        } else {
            return p.days.map(
                (day): PeriodCls => {
                    return new PeriodCls({
                        ...p,
                        day: typeof day === "string" ? DayEnum[day] : day
                    });
                }
            );
        }
    });
    return _.flatMap(result);
};

export const daysToNumber = (days: number[]) => {
    return days.reduce((d1, d2) => d1 | d2);
};

export const daysNumToArr = (day: number, criteria = 64): number[] => {
    if (criteria === 0) {
        return [];
    }
    if (day >= criteria) {
        const v = daysNumToArr(day - criteria, criteria >> 1);
        v.push(criteria);
        return v;
    } else {
        return daysNumToArr(day, criteria >> 1);
    }
};

export const getPeriodFromDB = (
    periodArr: Array<PeriodCls>,
    offset: number
) => {
    const result = mergePeriods(
        periodArr.map(
            p =>
                new PeriodCls({
                    ...p
                })
        )
    );
    return result;
};

export const setPeriodToDB = (
    periodArr: Array<PeriodWithDays>,
    offset: number
): Array<PeriodCls> => {
    if (!periodArr.length) {
        return [];
    }
    const offsetMinute = offset * 60;
    return splitPeriods(
        periodArr.map(
            (p): PeriodWithDays => {
                return {
                    days: p.days,
                    time: p.time,
                    start: p.start - offsetMinute,
                    end: p.end - offsetMinute
                };
            }
        )
    );
};

export const extractPeriodFromDate = (
    periodArr: Array<PeriodWithDays>,
    date: Date
) => {
    let st: number = 1440;
    let ed: number = 0;
    console.log(
        "GetSchedulesByDate Start ======================================================================="
    );
    console.log(date);
    const cDay = 1 << date.getUTCDay();
    periodArr.forEach(({ days, start, end }) => {
        // days를 비교하여 포함되어있는지 확인 ㄱㄱ
        const isIncludeInDays = (days & cDay) === cDay;
        if (isIncludeInDays) {
            // 포함하고 있으면 뭐 어떻게 해야함?
            if (start < st) {
                st = start;
            }
            if (ed < end) {
                ed = end;
            }
        }
    });
    const cDateWithoutHours = removeHours(date).getTime();
    const from = new Date(cDateWithoutHours + st * ONE_MINUTE);
    const to = new Date(cDateWithoutHours + ed * ONE_MINUTE);
    console.log({
        from,
        to
    });
    return {
        timeMillis: cDateWithoutHours,
        from,
        to
    };
};

export const divideDateTimeRange = (
    dateTimeRange: DateTimeRangeCls,
    unit: number
): Segment[] => {
    const { from, to } = {
        from: new Date(dateTimeRange.from.getTime()),
        to: dateTimeRange.to
    };
    const segmentList: Segment[] = [];
    while (to.getTime() > from.getTime()) {
        segmentList.push({
            from: new Date(from.getTime()),
            to: new Date(from.setTime(from.getTime() + unit * 60000))
        });
    }
    return segmentList;
};
