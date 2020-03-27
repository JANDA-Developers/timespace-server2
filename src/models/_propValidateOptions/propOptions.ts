import { PeriodOption } from "../../types/graph";
import { PropOptionsWithValidate } from "@typegoose/typegoose/lib/types";
import { ObjectId } from "mongodb";

export const propOptPeriodOption = (
    options?: PropOptionsWithValidate
): PropOptionsWithValidate => {
    return {
        ...options,
        validate: [
            {
                validator: (v: PeriodOption) => v.max > 0,
                message: "PeriodOption.max 값은 0또는 음수가 될 수 없습니다."
            },
            {
                validator: (v: PeriodOption) => v.min >= 0,
                message: "PeriodOption.min 값은 음수가 될 수 없습니다."
            },
            {
                validator: (v: PeriodOption) => v.max % v.unit === 0,
                message: "PeriodOption.max 값이 unit 의 배수가 아닙니다."
            },
            {
                validator: (v: PeriodOption) => v.min % v.unit === 0,
                message: "PeriodOption.min 값이 unit 의 배수가 아닙니다."
            },
            {
                validator: (v: PeriodOption) => v.unit >= 0,
                message: "PeriodOption.unit 값은 음수가 될 수 없습니다."
            }
        ]
    };
};

export const propOptIdOption = (
    options?: PropOptionsWithValidate
): PropOptionsWithValidate => {
    return {
        ...options,
        get: id => new ObjectId(id),
        set: id => new ObjectId(id)
    };
};

export const propOptIdsOption = (
    options?: PropOptionsWithValidate
): PropOptionsWithValidate => {
    return {
        ...options,
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id))
    };
};
