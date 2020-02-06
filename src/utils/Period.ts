import { ApolloError } from "apollo-server";
import { dateToMinutes } from "./utils";

export type Minute = number;

export class PeriodCls {
    constructor({
        start = 0,
        time = 1440,
        days = 127 // 매일매일...
    }: {
        start: number;
        time: number;
        days: number;
    }) {
        if (start < 0) {
            throw new ApolloError(
                "[PeriodCls] Period.start 값은 음수가 될 수 없습니다.",
                "PERIOD_START_NEGATIVE",
                {
                    start
                }
            );
        }
        this.start = start;
        if (time < 0) {
            throw new ApolloError(
                "[PeriodCls] Period.time 값은 음수가 될 수 없습니다.",
                "PERIOD_TIME_NEGATIVE",
                {
                    time
                }
            );
        }
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
        this.time = time;
        if (time) {
            this.end = start + time;
        }
        this.end = start + time;
        this.days = days % 128;
    }
    // 분(Minute) 단위 시간 사용
    start: Minute;
    end: Minute;
    time: Minute;
    days: number;

    isIn(this: PeriodCls, time: Date | number): boolean {
        const date: Date = new Date(time);
        console.log(date.toISOString());
        console.log({
            offset: date.getTimezoneOffset()
        });
        const minutes = dateToMinutes(date);
        const includedDay = (this.days & date.getDay()) !== 0;
        console.log({
            date: date.toISOString(),
            minutes,
            includedDay
        });
        // TODO: 구현해야됨!
        // date 또는 number 가 start, end 안에 들어오는지 검사
        // Backend 에서 계산하는 모든 Date들은 UTC 기준으로 계산된다.
        // 마지막에 반환할 떄 Locale 시간 더해서 출력됨
        // 입력 받을때 또한 Locale 시간 감안하여 가져온다.
        return includedDay && this.start <= minutes && minutes <= this.end;
    }
    // intersaction(this: PeriodCls): PeriodCls[] {}
    // differences(this: PeriodCls): PeriodCls[] {}
    // disperse(this: PeriodCls): PeriodCls[] {}
}
