import _ from "lodash";

export const ONE_MINUTE = 1000 * 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;
export const ONE_YEAR = ONE_DAY * 365;

// 1년중 몇째 날인지 계산 ㄱㄱ
export const dayOfYear = (cur: Date): number => {
    const start = new Date(cur.getFullYear(), 0, 0);
    const diff =
        cur.getTime() -
        start.getTime() +
        (start.getTimezoneOffset() - cur.getTimezoneOffset()) * 60 * 1000;
    return Math.floor(diff / ONE_DAY);
};

export const getDateArr = (start: Date, end: Date): Date[] => {
    const interval = (end.getTime() - start.getTime()) / ONE_DAY;
    const time = start.getTime();
    const result: Date[] = [start];
    for (let i = 1; i < interval; i++) {
        const temp = new Date(time + ONE_DAY * i);
        result.push(temp);
    }
    return result;
};

export const getDateString = (date: Date, timezoneOffset?: number): string => {
    return new Date(date.getTime() - (timezoneOffset || 0) * ONE_MINUTE)
        .toISOString()
        .split(".")[0]
        .replace(/[-:TZ.]/gi, "")
        .substring(0, 12);
};

export const convertStrToDateObj = (dateStr: string): Date => {
    const temp = dateStr.replace(/[-.:TZ]/g, "").substr(0, 14);
    if (temp.length < 8) {
        return new Date();
    }
    const y = parseInt(temp.substr(0, 4));
    const excY = _.chunk(temp.substr(4), 2).map(s => parseInt(s.join("")));
    return new Date(y, excY[0] - 1 || 0, excY[1] || 0, ...excY.splice(2));
};

export const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff =
        date.getTime() -
        start.getTime() +
        (start.getTimezoneOffset() - date.getTimezoneOffset()) * ONE_MINUTE;
    return Math.floor(diff / ONE_DAY);
};

export const dateToMinutes = (date: Date) => {
    return (date.getTime() % ONE_DAY) / ONE_MINUTE;
};

export const removeHours = (date: Date) => {
    const time = date.getTime();
    return new Date(time - (time % ONE_DAY));
};

export const offsetDate = (date: Date, offset: number) =>
    date.setTime(date.getTime() - offset * 60 * 60000);
