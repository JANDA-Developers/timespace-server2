import _ from "lodash";
type FalcyValue = "UNDEFINED" | "NULL" | "FALSE" | "EMPTY_STRING" | "ZERO";
export const removeUndefined = (obj: object, removeNull = true): typeof obj => {
    const t = _(obj).omitBy(_.isUndefined);

    if (removeNull) {
        return t.omitBy(_.isNull).value();
    }
    return t.value();
};

export const removeFields = (
    obj: object,
    removingFields: string[]
): typeof obj => {
    const t = _(obj)
        .omit(removingFields)
        .value();
    return t;
};

export const removeFalcy = (
    obj: object,
    excludeFalcy: FalcyValue[] = ["NULL", "UNDEFINED"]
): typeof obj => {
    let t = _(obj);

    excludeFalcy.forEach(opt => {
        if (opt === "NULL") {
            t = t.omitBy(_.isNull);
        } else if (opt === "UNDEFINED") {
            t = t.omitBy(_.isUndefined);
        } else if (opt === "ZERO") {
            t = t.omitBy(v => v === 0);
        } else if (opt === "EMPTY_STRING") {
            t = t.omitBy(v => v === "");
        } else if (opt === "FALSE") {
            t = t.omitBy(v => v === false);
        }
    });
    return t.value();
};

export const typedKeys = <T>(o: T): Array<keyof T> => {
    return Object.keys(o) as Array<keyof T>;
};
export const values = <T>(v: T): T[keyof T][] =>
    (Object.keys(v) as Array<keyof typeof v>).reduce((accumulator, current) => {
        accumulator.push(v[current]);
        return accumulator;
    }, [] as Array<typeof v[keyof typeof v]>);

export const getBites = (str: string): number => {
    if (!str) {
        return 0;
    }
    return str
        .split("")
        .map(s => s.charCodeAt(0))
        .reduce((prev, c) => prev + (c === 10 ? 2 : c >> 7 ? 2 : 1), 0); // 계산식에 관한 설명은 위 블로그에 있습니다.
};
