import { ONE_MINUTE, ONE_HOUR } from "./dateFuncs";
import { ClientSession } from "mongoose";
import { MongoError, ObjectId } from "mongodb";
import { mongoose } from "@typegoose/typegoose";
import { ApolloError } from "apollo-server";

export const getIP = (req: any): string[] => {
    const ips: string[] = (
        req.headers["x-forwarded-for"] ||
        req.headers["X-Forwarded-For"] ||
        req.ip
    )
        .split(",")
        .map((ip: string) => ip.trim());
    return ips;
};

export const getLocalDate = (date: Date, offsetHour?: number) => {
    return new Date(
        date.getTime() +
            (offsetHour !== undefined
                ? offsetHour * ONE_HOUR
                : -date.getTimezoneOffset() * ONE_MINUTE)
    );
};

export const errorReturn = async (error: any, dbSession?: ClientSession) => {
    if (dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
    }
    let code: string = "UNDEFINED";
    let msg: string = "UNDEFINED";
    if (error instanceof MongoError) {
        code = error.name;
    } else if (error instanceof mongoose.Error) {
        code = error.name;
    } else if (error instanceof ApolloError) {
        code = error.extensions.code;
    } else {
        code = error.code || error.name;
    }
    msg = error.message;

    return {
        ok: false,
        error: {
            code,
            msg,
            origin: error
        },
        data: null
    };
};

export const getByteLength = (s: string): number => {
    let b = 0;
    let c = 0;
    let i = 0;
    for (b = i = 0; (c = s.charCodeAt(i++)); b += c >> 11 ? 3 : c >> 7 ? 2 : 1);
    return b;
};

export const checkType = <T>(value: any): value is T => {
    return value;
};

export const isExist = (v: any): v is undefined | null => {
    return v;
};

export const toObjectId = (v: any): v is ObjectId => {
    try {
        const temp = new ObjectId(v);
        return !!temp;
    } catch (error) {
        return false;
    }
};
