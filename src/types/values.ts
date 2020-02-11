export type Minute = number;
export type Second = number;
export type Hour = number;

export enum ERROR_CODES {
    UNDERDEVELOPMENT = "UNDERDEVELOPMENT",
    USER_ACCESS_DENY = "USER_ACCESS_DENY",
    STORE_ACCESS_DENY = "STORE_ACCESS_DENY",
    PRODUCT_ACCESS_DENY = "PRODUCT_ACCESS_DENY",
    UNAUTHORIZED_USER = "UNAUTHORIZED_USER",
    UNEXIST_STORE = "UNEXIST_STORE",
    UNEXIST_PRODUCT = "UNEXIST_PRODUCT",
    UNEXIST_USER = "UNEXIST_USER",
    UNDEFINED_JWK = "UNDEFINED_JWK"
}
