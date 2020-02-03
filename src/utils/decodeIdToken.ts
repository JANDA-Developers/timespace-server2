import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import axios from "axios";
import { BaseResponse } from "../types/graph";
import { ApolloError } from "apollo-server";

interface JWKFormat {
    alg: string;
    e: string;
    kid: string;
    kty: "RSA";
    n: string;
    us: string;
}
const getJsonWebKeys = async (): Promise<JWKFormat[]> => {
    const keys = (
        await axios.get(
            `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_POOL_ID}/.well-known/jwks.json`
        )
    ).data.keys;
    return keys;
};

const decodeTokenHeader = (token: string) => {
    const [headerEncoded] = token.split(".");
    const buff = Buffer.from(headerEncoded, "base64");
    const text = buff.toString("ascii");
    return JSON.parse(text);
};

const getJsonWebKeyWithKID = async (kid: any, jsonWebKeys: JWKFormat[]) => {
    for (let jwk of jsonWebKeys) {
        if (jwk.kid === kid) {
            return jwk;
        }
    }
    return null;
};

export const decodeKey = async (
    token: string
): Promise<BaseResponse & { data: any }> => {
    const jsonWebKeys = await getJsonWebKeys();
    const header = decodeTokenHeader(token);
    try {
        const jwk = await getJsonWebKeyWithKID(header.kid, jsonWebKeys);
        if (!jwk) {
            throw new ApolloError("Undefined JWK", "UNDEFINED_JWK");
        }
        const pem = jwkToPem(jwk);
        const user = jwt.verify(token, pem);
        return {
            ok: true,
            error: null,
            data: user
        };
    } catch (error) {
        console.log({
            name: error.name,
            code: error.code,
            message: error.message,
            expiredAt: error.expiredAt,
            token
        });
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
