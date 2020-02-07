import _ from "lodash";
import { Types } from "mongoose";
import { getDayOfYear } from "../../utils/dateFuncs";

/**
 * YYYYMMDD-"HouseCode(6)"-"RandomCode(8)" => Legarcy
 * "HouseCode(6)"-"YM(3)Time(3)RandomCode32(4).toUpperCase()"
 * @param houseNum => houseNumGen을 통해 생성된 값임
 */
export const bookingNumGen = (houseNum: string | Types.ObjectId): string => {
    const date = new Date();
    const id =
        typeof houseNum !== "string"
            ? genCode(houseNum.toHexString())
            : houseNum;
    return `${id}-${getDayOfYear(date)}${date
        .getHours()
        .toString()
        .padStart(2, "0")}${Math.floor(date.getMinutes() / 10)
        .toString()
        .padStart(2, "0")}${s4(32)
        .toUpperCase()
        .substr(0, 2)}`;
};

export const genCode = (houseNum: string): string =>
    makeCodeByHexString({
        id: houseNum,
        units: [1, 2, 3, 5, 7],
        digits: 6
    });

export const guestIdGen = (): string => `G${s4()}-${s4()}-${s4()}-${s4()}`;

export const agencyIdGen = (): string => {
    return `${s4()}${s4()}-${s4()}${s4()}-${s4()}${s4()}`;
};

export const HMIdGen = (): string => {
    return `${s4()}${s4()}${s4()}${s4()}`;
};

export const s4 = (base: 16 | 32 = 16): string => {
    return (((1 + Math.random()) * (base === 16 ? 0x10000 : 0x1000000)) | 0)
        .toString(base)
        .substring(1);
};

export const decodeS4 = (num: string | number, base: 10 | 16 = 16): number =>
    parseInt(`${num}`, base);

// const s4Dec = () =>
//     (((1 + Math.random()) * 10000) | 0).toString(10).substring(1);

const sumHexArr = (strHexArr: string[]): number =>
    strHexArr.map(n => decodeS4(n)).reduce((a, b) => a + b);

export const makeCodeByHexString = ({
    id,
    units,
    digits
}: {
    id: string;
    units: number[];
    digits?: number;
}): string => {
    const arr: string[] = new Types.ObjectId(id).toHexString().split("");
    const chunkArr = units.map(n => _.chunk(arr, n).map(s => s.join("")));
    const sumTotal = chunkArr
        .map(strHexArrs => sumHexArr(strHexArrs))
        .reduce((a, b) => a + b)
        .toString(32)
        .toUpperCase();
    return sumTotal.padStart(digits || sumTotal.length, "0");
};
