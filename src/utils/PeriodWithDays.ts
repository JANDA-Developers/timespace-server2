import { Minute, DaysNum } from "../types/values";

export class PeriodWithDays {
    constructor({
        start,
        end,
        days,
        offset
    }: {
        start: Minute;
        end: Minute;
        days: DaysNum;
        offset: Minute;
    }) {
        this.start = start;
        this.end = end;
        this.days = days;
        this.offset = offset;
    }
    // 분(Minute) 단위 시간 사용
    start: Minute;
    end: Minute;
    time: Minute;
    // 1, 2, 4, 8, 16, 32, 64 의 숫자...
    days: DaysNum;
    offset: Minute;
}
