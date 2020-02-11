import { ApolloError } from "apollo-server";
import { dateToMinutes, daysToNumber } from "./utils";
import { Day } from "../types/graph";
import { Minute } from "../types/types";

export class PeriodCls {
    constructor({
        start = 0,
        time = 1440,
        days = 127 // 매일매일...
    }: {
        start: number;
        time: number;
        days: number | Day[];
    }) {
        this.start = start;
        this.time = time;
        if (time) {
            this.end = start + time;
        }
        this.end = start + time;
        this.days =
            typeof days === "number"
                ? days % 128
                : days.length === 0
                ? 0
                : daysToNumber(days);
        this.validate();
    }

    validate(this: PeriodCls) {
        if (this.start < 0) {
            throw new ApolloError(
                "[PeriodCls] Period.start 값은 음수가 될 수 없습니다.",
                "PERIOD_START_NEGATIVE",
                {
                    start: this.start
                }
            );
        }
        if (this.time < 0) {
            throw new ApolloError(
                "[PeriodCls] Period.time 값은 음수가 될 수 없습니다.",
                "PERIOD_TIME_NEGATIVE",
                {
                    time: this.time
                }
            );
        }
        this.end = this.start + this.time;
        // !보류
        // if (time > 1440) {
        //     throw new ApolloError(
        //         "[PeriodCls] Period.time 값은 1440분을 초과할 수 없습니다.",
        //         "PERIOD_TIME_EXCEED_LIMIT",
        //         {
        //             time
        //         }
        //     );
        // }
    }
    // 분(Minute) 단위 시간 사용
    start: Minute;
    end: Minute;
    time: Minute;
    days: number;

    isIn(this: PeriodCls, time: Date): boolean {
        const date: Date = time;
        const minutes = dateToMinutes(date);
        const includedDay = (this.days & (1 << date.getDay())) !== 0;
        return includedDay && this.start <= minutes && minutes <= this.end;
    }

    intersactions(this: PeriodCls, period: PeriodCls): PeriodCls | null {
        // 이제 겹치는 부분들을 구해볼까?
        const start = this.start < period.start ? period.start : this.start;
        const end = this.end > period.end ? period.end : this.end;
        const days = this.days & period.days;
        const p = new PeriodCls({
            start,
            time: end - start,
            days
        });
        return p;
    }

    // differences(this: PeriodCls): PeriodCls[] {}
    // disperse(this: PeriodCls): PeriodCls[] {}
}
