import { createLogger, format } from "winston";
// import winstonDaily from "winston-daily-rotate-file";
import AWS from "aws-sdk";
import WinstonCloudWatch from "winston-cloudwatch";

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
        // new transports.Console(),

        // new winstonDaily({
        //     level: "info",
        //     datePattern: "YYYYMMDDHH",
        //     dirname: process.env.LOG_DIR || "./logs",
        //     filename: `%DATE%.log`,
        //     maxSize: undefined,
        //     maxFiles: 48,
        //     frequency: "1h",
        //     utc: true
        // }),
        new WinstonCloudWatch({
            logGroupName: process.env.LOG_GROUP_NAME || "JD_BOOKING",
            logStreamName: (): string => {
                return `${new Date().toISOString().substr(0, 10)} [${process.env
                    .LOG_STREAM_NAME || "Nothing"}]`;
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

export { mLogger, stream };
