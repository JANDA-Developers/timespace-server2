import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import axios from "axios";

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
    const buff = new Buffer(headerEncoded, "base64");
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

export const decodeKey = async (token: string) => {
    const jsonWebKeys = await getJsonWebKeys();
    const header = decodeTokenHeader(token);
    const jwk = await getJsonWebKeyWithKID(header.kid, jsonWebKeys);
    if (!jwk) {
        return;
    }
    const pem = jwkToPem(jwk);
    const t = jwt.verify(token, pem);
    return t;
};
