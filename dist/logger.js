"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.mLogger = exports.fmtLog = void 0;
const winston_1 = require("winston");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const winston_cloudwatch_1 = __importDefault(require("winston-cloudwatch"));
const { combine, timestamp, printf } = winston_1.format;
const customFormat = printf(info => {
    return `{\n"[${info.level}]${info.timestamp}": \n${info.message} }`;
});
const mLogger = winston_1.createLogger({
    format: combine(timestamp({
        format: "YYYY-MM-DD HH:mm:ss"
    }), customFormat),
    transports: [
        new winston_cloudwatch_1.default({
            logGroupName: process.env.LOG_GROUP_NAME || "JD_BOOKING",
            logStreamName: () => {
                const cur = new Date().toISOString().split("T");
                return `[${process.env.LOG_STREAM_NAME || "Nothing"}] ${cur[0]} ${cur[1].substr(0, 2)}h00m`;
            },
            cloudWatchLogs: new aws_sdk_1.default.CloudWatchLogs()
        })
    ]
});
exports.mLogger = mLogger;
const stream = {
    write: (message) => {
        mLogger.info(message);
    }
};
exports.stream = stream;
exports.fmtLog = (level, format) => {
    const data = JSON.stringify(format);
    switch (level) {
        case "info":
            mLogger.info(data);
            break;
        case "warn":
            mLogger.warn(data);
            break;
        case "err":
            mLogger.error(data);
            break;
        default:
            mLogger.debug(data);
            break;
    }
};
//# sourceMappingURL=logger.js.map