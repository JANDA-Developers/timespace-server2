import { ONE_MINUTE, ONE_HOUR, ONE_DAY } from "./dateFuncs";
import { ClientSession } from "mongoose";
import { MongoError } from "mongodb";
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

export const dateToMinutes = (date: Date) => {
    return (date.getTime() % ONE_DAY) / ONE_MINUTE;
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
            msg
        },
        data: null
    };
};
