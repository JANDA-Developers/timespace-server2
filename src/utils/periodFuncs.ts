import { PeriodCls } from "./Period";
import _ from "lodash";
import { PeriodWithDays } from "./PeriodWithDays";
import { PeriodInput, Segment } from "GraphType";
import { DayEnum, Hour } from "../types/values";
import { DateTimeRangeCls } from "./DateTimeRange";

export const mergePeriods = (
    periods: Array<PeriodCls>,
    offset: Hour
): Array<PeriodWithDays> => {
    const sortedPeriod = _.sortBy(periods, [o => o.start, o => o.end]);

    const temp = sortedPeriod[0];
    const result: Array<PeriodWithDays> = [
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
            } else {
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

export const splitPeriods = (
    periods: Array<PeriodWithDays | PeriodInput>,
    offset: Hour
): Array<PeriodCls> => {
    const result = periods.map(p => {
        if (typeof p.days === "number") {
            return daysNumToArr(p.days).map(
                (day): PeriodCls => {
                    return new PeriodCls({
                        ...p,
                        day,
                        offset: offset * 60
                    });
                }
            );
        } else {
            return p.days.map(
                (day): PeriodCls => {
                    return new PeriodCls({
                        ...p,
                        day: typeof day === "string" ? DayEnum[day] : day,
                        offset: offset * 60
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

export const getPeriodFromDB = (periodArr: Array<PeriodCls>, offset: Hour) => {
    const result = mergePeriods(
        periodArr.map(
            p =>
                new PeriodCls({
                    ...p
                })
        ),
        offset
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
    return splitPeriods(
        periodArr.map(
            (p): PeriodWithDays => {
                return {
                    days: p.days,
                    time: p.time,
                    start: p.start,
                    end: p.end,
                    offset
                };
            }
        ),
        offset
    );
};

/**
 * 어떤 날짜에 몇시~몇시 까지 영업하는지 알아낼때 사용하는 함수.
 * 퍼포먼스는 보장 못함. ㅜ
 * @param periodArr PeriodWithDays 배열
 * @param date 날짜 => Hours 이하 필드들은 0으로 set한 뒤에 사용됨
 * @param offset
 */
export const extractPeriodFromDate = (
    periodArr: Array<PeriodWithDays>,
    date: Date,
    offset: Hour
) => {
    const periodList = splitPeriods(periodArr, offset);
    // 왜 2개가 나옴?
    const dateRanges = periodList
        .map(period => {
            try {
                return period.toDateTimeRange(date);
            } catch (error) {
                return undefined;
            }
        })
        .filter(v => v);
    return dateRanges[0];
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

export const validatePeriodWithDays = (
    periodWithDays: PeriodWithDays[]
): boolean => {
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

export const validatePeriod = (periodList: PeriodCls[]): boolean => {
    let isDuplicate = false;
    periodList
        .map((p: PeriodCls) => {
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
