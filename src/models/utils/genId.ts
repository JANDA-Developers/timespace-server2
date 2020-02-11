import _ from "lodash";
import { Types } from "mongoose";
import { getDayOfYear } from "../../utils/dateFuncs";
import { ObjectId } from "mongodb";

/**
 * YYYYMMDD-"HouseCode(6)"-"RandomCode(8)" => Legarcy
 * "ProductCode(11)"-"YM(3)Time(4)RandomCode32(2).toUpperCase()"
 * @param productCode => houseNumGen을 통해 생성된 값임
 */
export const genItemCode = (productCode: string, date = new Date()): string => {
    const codes = productCode.split("-");
    const codeToNum = decodeS4(codes[0], 36) + decodeS4(codes[1], 36);
    return `${codeToNum
        .toString(36)
        .padEnd(7, codes[0].charAt(codeToNum % 7))}-${getDayOfYear(date)}${date
        .getHours()
        .toString()
        .padStart(2, "0")}${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}${s4(36)
        .toUpperCase()
        .substr(0, 2)}`;
};

export const genCode = (id: string | ObjectId): string =>
    makeCodeByHexString({
        id,
        units: [1, 2, 3, 5, 7],
        digits: 6
    });

export const s4 = (base: 16 | 36 = 16): string => {
    return (((1 + Math.random()) * (base === 16 ? 0x10000 : 0x1000000)) | 0)
        .toString(base)
        .substring(1);
};

export const decodeS4 = (
    num: string | number,
    base: 10 | 16 | 36 = 16
): number => parseInt(`${num}`, base);

const sumHexArr = (strHexArr: string[]): number =>
    strHexArr.map(n => decodeS4(n)).reduce((a, b) => a + b);

export const makeCodeByHexString = ({
    id,
    units,
    digits
}: {
    id: string | ObjectId;
    units: number[];
    digits?: number;
}): string => {
    const arr: string[] = new Types.ObjectId(id).toHexString().split("");
    const chunkArr = units.map(n => _.chunk(arr, n).map(s => s.join("")));
    const sumTotal = chunkArr
        .map(strHexArrs => sumHexArr(strHexArrs))
        .reduce((a, b) => a + b)
        .toString(36)
        .toUpperCase();
    return sumTotal.padStart(digits || sumTotal.length, "0");
};
