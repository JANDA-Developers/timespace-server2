"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCodeByHexString = exports.decodeS4 = exports.s4 = exports.genCode = exports.genItemCode = void 0;
const lodash_1 = __importDefault(require("lodash"));
const dateFuncs_1 = require("../../utils/dateFuncs");
const mongodb_1 = require("mongodb");
/**
 * YYYYMMDD-"HouseCode(6)"-"RandomCode(8)" => Legarcy
 * "ProductCode(7)"-"YM(3)Time(4)RandomCode32(2).toUpperCase()"
 * @param productCode => houseNumGen을 통해 생성된 값임
 */
exports.genItemCode = (productCode, date = new Date()) => {
    const codes = productCode.split("-");
    const codeToNum = exports.decodeS4(codes[0], 36) + exports.decodeS4(codes[1], 36);
    return `${codeToNum
        .toString(36)
        .padEnd(7, codes[0].charAt(codeToNum % 7))}-${dateFuncs_1.getDayOfYear(date)}${date
        .getHours()
        .toString()
        .padStart(2, "0")}${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}${exports.s4(36).substr(0, 2)}`.toUpperCase();
};
exports.genCode = (id) => {
    const v = (parseInt(typeof id === "string" ? id : id.toHexString(), 36) % 5) + 1;
    return exports.makeCodeByHexString({
        id,
        units: Array(v).fill(7),
        digits: 6
    });
};
exports.s4 = (base = 16) => {
    return (((1 + Math.random()) * (base === 16 ? 0x10000 : 0x1000000)) | 0)
        .toString(base)
        .substring(1);
};
exports.decodeS4 = (num, base = 16) => parseInt(`${num}`, base);
const sumHexArr = (strHexArr) => strHexArr.map(n => exports.decodeS4(n)).reduce((a, b) => a + b);
exports.makeCodeByHexString = ({ id, units, digits }) => {
    const arr = new mongodb_1.ObjectId(id).toHexString().split("");
    const chunkArr = units.map(n => lodash_1.default.chunk(arr, n).map(s => s.join("")));
    const sumTotal = chunkArr
        .map(strHexArrs => sumHexArr(strHexArrs))
        .reduce((a, b) => a + b)
        .toString(36)
        .toUpperCase();
    return sumTotal.padStart(digits || sumTotal.length, "0");
};
//# sourceMappingURL=genId.js.map