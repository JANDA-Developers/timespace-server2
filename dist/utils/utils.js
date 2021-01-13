"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountryInfo = exports.toObjectId = exports.isExist = exports.checkType = exports.getByteLength = exports.errorReturn = exports.getLocalDate = exports.getIP = void 0;
const dateFuncs_1 = require("./dateFuncs");
const mongodb_1 = require("mongodb");
const typegoose_1 = require("@typegoose/typegoose");
const apollo_server_1 = require("apollo-server");
const CountryInfo_1 = require("../models/CountryInfo");
exports.getIP = (req) => {
    const ips = (req.headers["x-forwarded-for"] ||
        req.headers["X-Forwarded-For"] ||
        req.ip)
        .split(",")
        .map((ip) => ip.trim());
    return ips;
};
exports.getLocalDate = (date, offsetHour) => {
    return new Date(date.getTime() +
        (offsetHour !== undefined
            ? offsetHour * dateFuncs_1.ONE_HOUR
            : -date.getTimezoneOffset() * dateFuncs_1.ONE_MINUTE));
};
exports.errorReturn = async (error, dbSession) => {
    if (dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
    }
    let code = "UNDEFINED";
    let msg = "UNDEFINED";
    if (error instanceof mongodb_1.MongoError) {
        code = error.name;
    }
    else if (error instanceof typegoose_1.mongoose.Error) {
        code = error.name;
    }
    else if (error instanceof apollo_server_1.ApolloError) {
        code = error.extensions.code;
    }
    else {
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
exports.getByteLength = (s) => {
    let b = 0;
    let c = 0;
    let i = 0;
    for (b = i = 0; (c = s.charCodeAt(i++)); b += c >> 11 ? 3 : c >> 7 ? 2 : 1)
        ;
    return b;
};
exports.checkType = (value) => {
    return value;
};
exports.isExist = (v) => {
    return v;
};
exports.toObjectId = (v) => {
    try {
        const temp = new mongodb_1.ObjectId(v);
        return !!temp;
    }
    catch (error) {
        return false;
    }
};
exports.getCountryInfo = async (timezone) => {
    const countryInfo = await CountryInfo_1.CountryInfoModel.findOne({
        "timezones.name": timezone
    });
    if (!countryInfo) {
        throw new apollo_server_1.ApolloError("Timezone 설정이 잘못되었습니다.", "UNDEFINED_COUNTRYINFO", {
            timezone
        });
    }
    const tz = countryInfo.timezones.find(tz => tz.name === timezone);
    if (!tz) {
        throw new apollo_server_1.ApolloError(`Timezone is falcy value ${tz}`, "TIMEZONE_IS_FALCY");
    }
    const zoneinfo = {
        name: countryInfo.countryName,
        tz: tz.name,
        code: countryInfo.countryCode,
        offset: tz.offset,
        callingCode: countryInfo.callingCode
    };
    return zoneinfo;
};
//# sourceMappingURL=utils.js.map