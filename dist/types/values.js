"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_STORE_COLOR = exports.DB_URI = exports.DayEnum = exports.ERROR_CODES = void 0;
var ERROR_CODES;
(function (ERROR_CODES) {
    ERROR_CODES["UNDERDEVELOPMENT"] = "UNDERDEVELOPMENT";
    ERROR_CODES["ACCESS_DENY_USER"] = "ACCESS_DENY_USER";
    ERROR_CODES["ACCESS_DENY_STORE"] = "ACCESS_DENY_STORE";
    ERROR_CODES["ACCESS_DENY_ITEM"] = "ACCESS_DENY_ITEM";
    ERROR_CODES["ACCESS_DENY_PRODUCT"] = "ACCESS_DENY_PRODUCT";
    ERROR_CODES["UNAUTHORIZED_USER"] = "UNAUTHORIZED_USER";
    ERROR_CODES["UNAUTHORIZED_STORE_USER"] = "UNAUTHORIZED_STORE_USER";
    ERROR_CODES["UNEXIST_STORE"] = "UNEXIST_STORE";
    ERROR_CODES["UNEXIST_PRODUCT"] = "UNEXIST_PRODUCT";
    ERROR_CODES["UNEXIST_GROUP"] = "UNEXIST_GROUP";
    ERROR_CODES["UNEXIST_USER"] = "UNEXIST_USER";
    ERROR_CODES["UNDEFINED_JWK"] = "UNDEFINED_JWK";
    ERROR_CODES["DATETIMERANGE_UNIT_ERROR"] = "DATETIMERANGE_UNIT_ERROR";
    ERROR_CODES["VALUE_ERROR"] = "VALUE_ERROR";
    ERROR_CODES["UNAVAILABLE_SOLD_OUT"] = "UNAVAILABLE_SOLD_OUT";
    ERROR_CODES["UNAVAILABLE_BUSINESSHOURS"] = "UNAVAILABLE_BUSINESSHOURS";
    ERROR_CODES["UNEXIST_ITEM"] = "UNEXIST_ITEM";
    ERROR_CODES["UNAVAILABLE_QUERY_DATE"] = "UNAVAILABLE_QUERY_DATE";
    ERROR_CODES["INVALID_USER_SUB"] = "INVALID_USER_SUB";
    ERROR_CODES["ALREADY_CANCELED_ITEM"] = "ALREADY_CANCELED_ITEM";
    ERROR_CODES["ALREADY_PERMITTED_ITEM"] = "ALREADY_PERMITTED_ITEM";
    ERROR_CODES["IMPOSIBLE_CHANGE_ITEM_STATUS"] = "IMPOSIBLE_CHANGE_ITEM_STATUS";
    ERROR_CODES["UNDEFINED_COUNTRYINFO"] = "UNDEFINED_COUNTRYINFO";
    ERROR_CODES["FALCY_TIMEZONE"] = "FALCY_TIMEZONE";
    ERROR_CODES["INVALID_VALUES"] = "INVALID_VALUES";
    ERROR_CODES["UNINCLUDED_BOOKING_DATERANGE"] = "UNINCLUDED_BOOKING_DATERANGE";
    ERROR_CODES["TOKEN_REFRESH_FAIL"] = "TOKEN_REFRESH_FAIL";
    ERROR_CODES["SMS_SEND_FAIL"] = "SMS_SEND_FAIL";
    ERROR_CODES["INVALID_PARAMETERS"] = "INVALID_PARAMETERS";
    ERROR_CODES["ALREADY_REGISTERED_SENDER"] = "ALREADY_REGISTERED_SENDER";
    ERROR_CODES["PASSWORD_COMPARE_ERROR"] = "PASSWORD_COMPARE_ERROR";
    ERROR_CODES["DELETED_STORE"] = "DELETED_STORE";
    ERROR_CODES["ITEM_VALIDATION_ERROR"] = "ITEM_VALIDATION_ERROR";
    ERROR_CODES["UNEXIST_SMS_KEY"] = "UNEXIST_SMS_KEY";
    ERROR_CODES["ACCESS_DENY_STORE_GROUP"] = "ACCESS_DENY_STORE_GROUP";
    ERROR_CODES["FAIL_TO_SIGNOUT"] = "FAIL_TO_SIGNOUT";
    ERROR_CODES["UNEXIST_STORE_CODE"] = "UNEXIST_STORE_CODE";
    ERROR_CODES["UNEXIST_STORE_USER"] = "UNEXIST_STORE_USER";
    ERROR_CODES["INVALID_USER_INFO"] = "INVALID_USER_INFO";
    ERROR_CODES["AUTHORIZATION_FAIL"] = "AUTHORIZATION_FAIL";
})(ERROR_CODES = exports.ERROR_CODES || (exports.ERROR_CODES = {}));
var DayEnum;
(function (DayEnum) {
    DayEnum[DayEnum["SUN"] = 1] = "SUN";
    DayEnum[DayEnum["MON"] = 2] = "MON";
    DayEnum[DayEnum["TUE"] = 4] = "TUE";
    DayEnum[DayEnum["WED"] = 8] = "WED";
    DayEnum[DayEnum["THU"] = 16] = "THU";
    DayEnum[DayEnum["FRI"] = 32] = "FRI";
    DayEnum[DayEnum["SAT"] = 64] = "SAT";
})(DayEnum = exports.DayEnum || (exports.DayEnum = {}));
exports.DB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
exports.DEFAULT_STORE_COLOR = "#32297d";
//# sourceMappingURL=values.js.map