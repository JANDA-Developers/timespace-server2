"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBites = exports.values = exports.typedKeys = exports.removeFalcy = exports.removeFields = exports.removeUndefined = void 0;
const lodash_1 = __importDefault(require("lodash"));
exports.removeUndefined = (obj, removeNull = true) => {
    const t = lodash_1.default(obj).omitBy(lodash_1.default.isUndefined);
    if (removeNull) {
        return t.omitBy(lodash_1.default.isNull).value();
    }
    return t.value();
};
exports.removeFields = (obj, removingFields) => {
    const t = lodash_1.default(obj)
        .omit(removingFields)
        .value();
    return t;
};
exports.removeFalcy = (obj, excludeFalcy = ["NULL", "UNDEFINED"]) => {
    let t = lodash_1.default(obj);
    excludeFalcy.forEach(opt => {
        if (opt === "NULL") {
            t = t.omitBy(lodash_1.default.isNull);
        }
        else if (opt === "UNDEFINED") {
            t = t.omitBy(lodash_1.default.isUndefined);
        }
        else if (opt === "ZERO") {
            t = t.omitBy(v => v === 0);
        }
        else if (opt === "EMPTY_STRING") {
            t = t.omitBy(v => v === "");
        }
        else if (opt === "FALSE") {
            t = t.omitBy(v => v === false);
        }
    });
    return t.value();
};
exports.typedKeys = (o) => {
    return Object.keys(o);
};
exports.values = (v) => Object.keys(v).reduce((accumulator, current) => {
    accumulator.push(v[current]);
    return accumulator;
}, []);
exports.getBites = (str) => {
    if (!str) {
        return 0;
    }
    return str
        .split("")
        .map(s => s.charCodeAt(0))
        .reduce((prev, c) => prev + (c === 10 ? 2 : c >> 7 ? 2 : 1), 0); // 계산식에 관한 설명은 위 블로그에 있습니다.
};
//# sourceMappingURL=objectFuncs.js.map