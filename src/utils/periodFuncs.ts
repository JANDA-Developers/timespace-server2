import { PeriodCls } from "./Period";
import _ from "lodash";
import { PeriodWithDays } from "./PeriodWithDays";
import { PeriodInput } from "../types/graph";
import { DayEnum } from "../types/values";

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
            ...temp,
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
                    ...element,
                    days: element.day
                });
            }
        }
    }
    console.log("MergePeriod ============================================");
    console.log(periods);
    return result;
};

export const splitPeriods = (
    periods: Array<PeriodWithDays | PeriodInput>
): Array<PeriodCls> => {
    const result = periods.map(p => {
        if (p instanceof PeriodWithDays) {
            return daysNumToArr(p.days).map(
                (day): PeriodCls => {
                    return new PeriodCls({
                        ...p,
                        day,
                        offset: 0
                    });
                }
            );
        } else {
            return p.days.map(
                (day): PeriodCls => {
                    return new PeriodCls({
                        ...p,
                        offset: 0,
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
