"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodCls = void 0;
const apollo_server_1 = require("apollo-server");
const dateFuncs_1 = require("./dateFuncs");
const DateTimeRange_1 = require("./DateTimeRange");
class PeriodCls {
    constructor({ start = 0, end, day, offset }) {
        this.start = start;
        this.end = end;
        this.time = end - start;
        this.day = day;
        this.offset = offset;
        this.validate();
    }
    validate() {
        if (this.start < 0) {
            throw new apollo_server_1.ApolloError("[PeriodCls] Period.start 값은 음수가 될 수 없습니다.", "PERIOD_START_NEGATIVE", {
                start: this.start
            });
        }
        if (this.end < 0) {
            throw new apollo_server_1.ApolloError("[PeriodCls] Period.end 값은 음수가 될 수 없습니다.", "PERIOD_START_NEGATIVE", {
                end: this.end
            });
        }
        // 1440을 넘길 수 있음... 다음날 새벽까지 영업을 하는 경우.
        // if (this.end > 1440) {
        //     throw new ApolloError(
        //         "[PeriodCls] Period.end 값은 하루(1440분)을 넘길 수 없습니다.",
        //         "PERIOD_END_OVER_ONEDAY",
        //         {
        //             end: this.end
        //         }
        //     );
        // }
        if (this.time > 1440) {
            throw new apollo_server_1.ApolloError("[PeriodCls] Period.time 값은 하루(1440분)을 넘길 수 없습니다.", "PERIOD_TIME_OVER_ONEDAY", {
                time: this.time
            });
        }
        if (this.time <= 0) {
            throw new apollo_server_1.ApolloError("[PeriodCls] Period.time 값은 음수 또는 0이 될 수 없습니다.", "PERIOD_TIME_NEGATIVE", {
                time: this.time
            });
        }
        if (this.start >= this.end) {
            throw new apollo_server_1.ApolloError("[PeriodCls] start값이 end값보다 크거나 같습니다.", "PERIOD_START_OVER_END", {
                start: this.start,
                end: this.end
            });
        }
    }
    isSameTime({ start, end }) {
        return start === this.start && end === this.end;
    }
    // isIn(this: PeriodCls, time: Date): boolean {
    //     const date: Date = time;
    //     const minutes = dateToMinutes(date);
    //     const includedDay = (this.day & (1 << date.getDay())) !== 0;
    //     return includedDay && this.start <= minutes && minutes <= this.end;
    // }
    intersactions(period) {
        // 이제 겹치는 부분들을 구해볼까?
        const start = this.start < period.start ? period.start : this.start;
        const end = this.end > period.end ? period.end : this.end;
        const day = this.day & period.day;
        const p = new PeriodCls({
            start,
            end,
            day,
            offset: period.offset
        });
        return p;
    }
    /**
     * 포함관계를 알아봄. Period가 target을 포함하는지...
     * @param period 메인
     * @param target 포함되는지 알아볼 대상
     * @param options
     */
    isInclude(target, options = { exceptDays: false, exceptTime: false }) {
        const isIncludeDays = options.exceptDays === false
            ? (this.day & target.day) === target.day
            : true;
        const isIncludeTimes = options.exceptTime === false
            ? this.start <= target.start && this.end >= target.end
            : true;
        return options.exceptDays !== false && isIncludeDays && isIncludeTimes;
    }
    toDateTimeRange(
    /** Date 단위로... 날짜로... */ date) {
        if ((this.day & (1 << date.getUTCDay())) !== 0) {
            const time = date.getTime() - (date.getTime() % dateFuncs_1.ONE_DAY);
            // 날짜 구함
            const offsetMillisec = this.offset * dateFuncs_1.ONE_MINUTE;
            const from = new Date(time + this.start * dateFuncs_1.ONE_MINUTE - offsetMillisec);
            const to = new Date(time + this.end * dateFuncs_1.ONE_MINUTE - offsetMillisec);
            return new DateTimeRange_1.DateTimeRangeCls({ from, to });
        }
        else {
            throw new apollo_server_1.ApolloError("date가 Period의 범위에 포함되지 않습니다.");
        }
    }
}
exports.PeriodCls = PeriodCls;
//# sourceMappingURL=Period.js.map