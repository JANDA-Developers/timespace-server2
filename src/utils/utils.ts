import { ONE_MINUTE, ONE_HOUR } from "./dateFuncs";

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