"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propOptIdsOption = exports.propOptIdOption = exports.propOptPeriodOption = void 0;
const mongodb_1 = require("mongodb");
exports.propOptPeriodOption = (options) => {
    return {
        ...options,
        validate: [
            {
                validator: (v) => v.max > 0,
                message: "PeriodOption.max 값은 0또는 음수가 될 수 없습니다."
            },
            {
                validator: (v) => v.min >= 0,
                message: "PeriodOption.min 값은 음수가 될 수 없습니다."
            },
            {
                validator: (v) => v.max % v.unit === 0,
                message: "PeriodOption.max 값이 unit 의 배수가 아닙니다."
            },
            {
                validator: (v) => v.min % v.unit === 0,
                message: "PeriodOption.min 값이 unit 의 배수가 아닙니다."
            },
            {
                validator: (v) => v.unit >= 0,
                message: "PeriodOption.unit 값은 음수가 될 수 없습니다."
            }
        ]
    };
};
exports.propOptIdOption = (options) => {
    return {
        ...options,
        get: id => new mongodb_1.ObjectId(id),
        set: id => new mongodb_1.ObjectId(id)
    };
};
exports.propOptIdsOption = (options) => {
    return {
        ...options,
        get: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        set: (ids) => ids.map(id => new mongodb_1.ObjectId(id))
    };
};
//# sourceMappingURL=propOptions.js.map