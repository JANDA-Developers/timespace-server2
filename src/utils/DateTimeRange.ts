import { Minute } from "../types/values";
import { ONE_MINUTE } from "./dateFuncs";

export class DateTimeRangeCls {
    constructor(param: any) {
        const { from, to } = {
            from: new Date(param.from),
            to: new Date(param.to)
        };
        this.from = from;
        this.to = to;
        this.interval = Math.floor(
            (this.from.getTime() - this.to.getTime()) / ONE_MINUTE
        );
    }

    from: Date;
    to: Date;
    // 역시나 여기도 "Minute" 단위로 설정
    interval: Minute;
}
