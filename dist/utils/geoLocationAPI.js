"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeoInfoByIP = void 0;
const axios_1 = __importDefault(require("axios"));
/* eslint-disable @typescript-eslint/camelcase */
const GEO_LOCATION_END_POINT = `${process.env.IPGEOLOCATION_END_POINT}`;
exports.getGeoInfoByIP = async (ipAddress) => {
    const edgeUrlWithAPIkey = `${GEO_LOCATION_END_POINT}${process.env.IPGEOLOCATION_END_POINT_EDGE_IPGEO}?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=${ipAddress}`;
    const { data } = await axios_1.default.get(edgeUrlWithAPIkey);
    return data;
};
//# sourceMappingURL=geoLocationAPI.js.map