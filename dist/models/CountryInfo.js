"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountryInfoModel = exports.CountryInfo = void 0;
const mongodb_1 = require("mongodb");
const BaseSchema_1 = require("../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("./__collectionNames");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../types/values");
let CountryInfo = class CountryInfo {
};
CountryInfo.getZoneinfo = async (timezone) => {
    const countryInfo = await exports.CountryInfoModel.findOne({
        "timezones.name": timezone
    });
    if (!countryInfo) {
        throw new apollo_server_1.ApolloError("Timezone 설정이 잘못되었습니다.", values_1.ERROR_CODES.UNDEFINED_COUNTRYINFO, {
            timezone
        });
    }
    const tz = countryInfo.timezones.find(tz => tz.name === timezone);
    if (!tz) {
        throw new apollo_server_1.ApolloError(`Timezone is falcy value ${tz}`, values_1.ERROR_CODES.FALCY_TIMEZONE);
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
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], CountryInfo.prototype, "_id", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], CountryInfo.prototype, "countryName", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], CountryInfo.prototype, "countryCode", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], CountryInfo.prototype, "callingCode", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Array)
], CountryInfo.prototype, "timezones", void 0);
CountryInfo = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.ZONE_INFO)))
], CountryInfo);
exports.CountryInfo = CountryInfo;
exports.CountryInfoModel = typegoose_1.getModelForClass(CountryInfo);
//# sourceMappingURL=CountryInfo.js.map