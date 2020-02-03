import { createLogger, format } from "winston";
import AWS from "aws-sdk";
import WinstonCloudWatch from "winston-cloudwatch";
import { LogFormat } from "./types/formats";

const { combine, timestamp, printf } = format;

const customFormat = printf(info => {
    return `{\n"[${info.level}]${info.timestamp}": \n${info.message} }`;
});

const mLogger = createLogger({
    format: combine(
        timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        }),
        customFormat
    ),
    transports: [
        new WinstonCloudWatch({
            logGroupName: process.env.LOG_GROUP_NAME || "JD_BOOKING",
            logStreamName: (): string => {
                const cur = new Date().toISOString().split("T");
                return `[${process.env.LOG_STREAM_NAME || "Nothing"}] ${
                    cur[0]
                } ${cur[1].substr(0, 2)}h00m`;
            },
            cloudWatchLogs: new AWS.CloudWatchLogs()
        })
    ]
});

const stream = {
    write: (message: string): void => {
        mLogger.info(message);
    }
};

export const fmtLog = (
    level: "info" | "err" | "warn" | "debug",
    format: LogFormat
): void => {
    const data = JSON.stringify(format);
    switch (level) {
        case "info":
            mLogger.info(data);
            break;
        case "warn":
            mLogger.info(data);
            break;
        case "err":
            mLogger.error(data);
            break;
        default:
            mLogger.debug(data);
            break;
    }
};

export { mLogger, stream };
