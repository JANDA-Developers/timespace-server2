"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCognitoUser = exports.decodeKey = exports.decodeKeyForBuyer = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwk_to_pem_1 = __importDefault(require("jwk-to-pem"));
const axios_1 = __importDefault(require("axios"));
const apollo_server_1 = require("apollo-server");
const values_1 = require("../types/values");
const getJsonWebKeys = async (userPoolId) => {
    const keys = (await axios_1.default.get(`https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${userPoolId}/.well-known/jwks.json`)).data.keys;
    return keys;
};
const decodeTokenHeader = (token) => {
    const [headerEncoded] = token.split(".");
    const buff = Buffer.from(headerEncoded, "base64");
    const text = buff.toString("ascii");
    return JSON.parse(text);
};
const getJsonWebKeyWithKID = async (kid, jsonWebKeys) => {
    for (let jwk of jsonWebKeys) {
        if (jwk.kid === kid) {
            return jwk;
        }
    }
    return null;
};
exports.decodeKeyForBuyer = async (token) => {
    const jsonWebKeys = await getJsonWebKeys(process.env.COGNITO_POOL_ID_BUYER || "");
    const header = decodeTokenHeader(token);
    try {
        const jwk = await getJsonWebKeyWithKID(header.kid, jsonWebKeys);
        if (!jwk) {
            throw new apollo_server_1.ApolloError("Undefined JWK", values_1.ERROR_CODES.UNDEFINED_JWK);
        }
        const pem = jwk_to_pem_1.default(jwk);
        const buyer = jsonwebtoken_1.default.verify(token, pem);
        return {
            ok: true,
            error: null,
            data: buyer
        };
    }
    catch (error) {
        return {
            ok: false,
            error: {
                ...error,
                code: error.code || error.name
            },
            data: null
        };
    }
};
exports.decodeKey = async (token) => {
    const jsonWebKeys = await getJsonWebKeys(process.env.COGNITO_POOL_ID || "");
    const header = decodeTokenHeader(token);
    try {
        const jwk = await getJsonWebKeyWithKID(header.kid, jsonWebKeys);
        if (!jwk) {
            throw new apollo_server_1.ApolloError("Undefined JWK", values_1.ERROR_CODES.UNDEFINED_JWK);
        }
        const pem = jwk_to_pem_1.default(jwk);
        const user = jsonwebtoken_1.default.verify(token, pem);
        return {
            ok: true,
            error: null,
            data: user
        };
    }
    catch (error) {
        return {
            ok: false,
            error: {
                ...error,
                code: error.code || error.name
            },
            data: null
        };
    }
};
exports.getCognitoUser = async (token) => {
    if (token) {
        const { ok, error, data } = await exports.decodeKey(token);
        if (!ok && error) {
            return error.code || "";
        }
        if (data) {
            if (data["custom:_id"]) {
                data._id = data["custom:_id"];
                if (data.zoneinfo) {
                    data.zoneinfo = JSON.parse(data.zoneinfo);
                }
                // 여기서 세팅 요망
            }
            // Raw Data임... DB에 있는 Cognito User 절대 아님
        }
        return data;
    }
};
//# sourceMappingURL=decodeIdToken.js.map