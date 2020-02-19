import { ApolloError } from "apollo-server";
import { ONE_DAY, ONE_MINUTE } from "./dateFuncs";
import { Minute } from "../types/values";
import { DateTimeRangeCls } from "./DateTimeRange";

export class PeriodCls {
    // 분(Minute) 단위 시간 사용
    start: Minute;
    end: Minute;
    time: Minute;
    // 1, 2, 4, 8, 16, 32, 64 의 숫자...
    day: number;

    constructor({
        start = 0,
        end,
        day
    }: {
        start: number;
        day: number;
        end: number;
    }) {
        this.start = start;
        this.end = end;
        this.time = end - start;
        this.day = day;
        this.validate();
    }

    validate(this: PeriodCls) {
        if (this.time <= 0) {
            throw new ApolloError(
                "[PeriodCls] Period.time 값은 음수 또는 0이 될 수 없습니다.",
                "PERIOD_TIME_NEGATIVE",
                {
                    time: this.time
                }
            );
        }
        if (this.start >= this.end) {
            throw new ApolloError(
                "[PeriodCls] start값이 end값보다 크거나 같습니다.",
                "PERIOD_START_OVER_END",
                {
                    start: this.start,
                    end: this.end
                }
            );
        }
    }

    isSameTime({ start, end }: { start: number; end: number }): boolean {
        return start === this.start && end === this.end;
    }

    // isIn(this: PeriodCls, time: Date): boolean {
    //     const date: Date = time;
    //     const minutes = dateToMinutes(date);
    //     const includedDay = (this.day & (1 << date.getDay())) !== 0;
    //     return includedDay && this.start <= minutes && minutes <= this.end;
    // }

    intersactions(this: PeriodCls, period: PeriodCls): PeriodCls | null {
        // 이제 겹치는 부분들을 구해볼까?
        const start = this.start < period.start ? period.start : this.start;
        const end = this.end > period.end ? period.end : this.end;
        const day = this.day & period.day;
        const p = new PeriodCls({
            start,
            end,
            day
        });
        return p;
    }

    /**
     * 포함관계를 알아봄. Period가 target을 포함하는지...
     * @param period 메인
     * @param target 포함되는지 알아볼 대상
     * @param options
     */
    isInclude(
        this: PeriodCls,
        target: PeriodCls,
        options = { exceptDays: false, exceptTime: false }
    ): boolean {
        const isIncludeDays =
            options.exceptDays === false
                ? (this.day & target.day) === target.day
                : true;
        const isIncludeTimes =
            options.exceptTime === false
                ? this.start <= target.start && this.end >= target.end
                : true;
        return options.exceptDays !== false && isIncludeDays && isIncludeTimes;
    }

    toDateTimeRange(this: PeriodCls, date: Date): DateTimeRangeCls {
        const time = date.getTime() - (date.getTime() % ONE_DAY);
        const from = new Date(time + this.start * ONE_MINUTE);
        const to = new Date(time + this.end * ONE_MINUTE);
        return new DateTimeRangeCls({ from, to });
    }

    isSubsetOfPeriod(
        this: PeriodCls,
        dateTimeRange: DateTimeRangeCls
    ): boolean {
        const { from, to } = dateTimeRange;
        const { start, end } = this;
        console.log({ start, end });
        const fDay = from.getUTCDay();
        const tDay = to.getUTCDay();
        if (fDay === tDay) {
            const day = fDay;
            const time = from.getTime();
            console.log(time);
            return day === this.day && false;
        } else if (fDay < tDay) {
            return false;
        } else {
            return false;
        }
    }

    // differences(this: PeriodCls): PeriodCls[] {}
    // disperse(this: PeriodCls): PeriodCls[] {}
}
