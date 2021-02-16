"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateResolverForInternalExec = exports.privateResolverForStoreUser = exports.privateResolverForStoreGroup = exports.privateResolverForBuyer = exports.privateResolver = exports.defaultResolver = exports.hexDecode = void 0;
const logger_1 = require("../logger");
const apollo_server_1 = require("apollo-server");
const utils_1 = require("./utils");
const values_1 = require("../types/values");
const Store_1 = require("../models/Store/Store");
const StoreUser_1 = require("../models/StoreUser/StoreUser");
const mongodb_1 = require("mongodb");
const StoreGroup_1 = require("../models/StoreGroup");
const helper_1 = require("../models/helpers/helper");
exports.hexDecode = function (str) {
    var j;
    var hexes = str.match(/.{1,4}/g) || [];
    var back = "";
    for (j = 0; j < hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
    }
    return back;
};
/**
 * 리솔버 로거... 로그 찍어주는 아이 ㅎㅎ
 * @param resolverFunction
 */
exports.defaultResolver = (resolverFunction) => async (parent, args, context, info) => {
    const startTime = new Date();
    const stack = [];
    const { headers, body, cognitoUser, cognitoBuyer } = context.req;
    const ips = utils_1.getIP(context.req);
    let result;
    try {
        result = await resolverFunction({ parent, args, context, info }, stack);
    }
    catch (error) {
        result = {
            ok: false,
            error: {
                code: error.code,
                msg: error.message,
                origin: error
            },
            data: null
        };
    }
    const user = cognitoUser || cognitoBuyer;
    const offset = (user && user.zoneinfo && parseInt(user.zoneinfo.offset)) || undefined;
    logger_1.fmtLog(result.error ? "err" : "info", {
        when: {
            utc: startTime.toISOString(),
            localTime: utils_1.getLocalDate(startTime, offset).toISOString()
        },
        who: {
            ...headers,
            ip: {
                clientIP: ips[0],
                proxys: ips.slice(1)
            },
            "X-JWT": headers["X-JWT"] || headers["x-jwt"],
            "X-JWT-B": headers["X-JWT-B"] || headers["x-jwt-b"],
            "user-agent": headers["user-agent"],
            user: user && {
                sub: user.sub,
                email: user.email,
                // eslint-disable-next-line @typescript-eslint/camelcase
                phone_number: user.phone_number,
                name: user.name,
                exp: user.exp
            }
        },
        where: info.fieldName,
        data: {
            resTime: `${new Date().getTime() - startTime.getTime()} ms`,
            body,
            input: args,
            stack,
            output: result
        }
    });
    return result;
};
exports.privateResolver = (resolverFunction) => async ({ parent, args, context, info }, stack) => {
    var _a;
    try {
        if (!context.req.cognitoUser) {
            const token = (_a = context.req.session.seller) === null || _a === void 0 ? void 0 : _a.idToken;
            console.log({
                token
            });
            if (token === "TokenExpiredError") {
                throw new apollo_server_1.ApolloError("만료된 토큰입니다. 다시 로그인 해주세요", "TOKEN_EXPIRED_ERROR", {
                    headers: context.req.headers
                });
            }
            throw new apollo_server_1.ApolloError("Unauthorized", values_1.ERROR_CODES.UNAUTHORIZED_USER, {
                jwt: context.req.headers.jwt
            });
        }
        return await resolverFunction({ parent, args, context, info }, stack);
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
exports.privateResolverForBuyer = (resolverFunction) => async ({ parent, args, context, info }, stack) => {
    var _a;
    try {
        if (!context.req.cognitoBuyer) {
            const token = (_a = context.req.session.buyer) === null || _a === void 0 ? void 0 : _a.idToken;
            if (token === "TokenExpiredError") {
                throw new apollo_server_1.ApolloError("만료된 토큰입니다. 다시 로그인 해주세요", "TOKEN_EXPIRED_ERROR", {
                    headers: context.req.headers
                });
            }
            throw new apollo_server_1.ApolloError("Unauthorized", values_1.ERROR_CODES.UNAUTHORIZED_USER, {
                jwt: context.req.headers.jwt
            });
        }
        return await resolverFunction({ parent, args, context, info }, stack);
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
exports.privateResolverForStoreGroup = (resolverFunction) => async ({ parent, args, context, info }, stack) => {
    try {
        const storeGroupCode = context.req.sgcode;
        const storeCode = context.req.scode;
        if (!storeGroupCode && !storeCode) {
            throw new apollo_server_1.ApolloError("인증 에러.", values_1.ERROR_CODES.ACCESS_DENY_STORE_GROUP);
        }
        if (storeGroupCode) {
            const storeGroup = await StoreGroup_1.StoreGroupModel.findByCode(storeGroupCode);
            console.log({
                storeGroup
            });
            if (!storeGroup) {
                throw new apollo_server_1.ApolloError("StoreGroup 인증 에러", values_1.ERROR_CODES.UNEXIST_STORE_CODE);
            }
            context.req.storeGroup = storeGroup;
        }
        if (storeCode) {
            const store = await Store_1.StoreModel.findByCode(storeCode);
            if (!store) {
                throw new apollo_server_1.ApolloError("Store 인증 에러", values_1.ERROR_CODES.UNEXIST_STORE_CODE);
            }
            context.req.store = store;
        }
        return await resolverFunction({ parent, args, context, info }, stack);
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
exports.privateResolverForStoreUser = (resolverFunction) => async ({ parent, args, context, info }, stack) => {
    var _a, _b;
    try {
        const sgcode = context.req.sgcode;
        if (!sgcode) {
            throw new apollo_server_1.ApolloError("StoreGroupCode가 입력되지 않았습니다.", values_1.ERROR_CODES.INVALID_PARAMETERS);
        }
        const data = await helper_1.convertStoreGroupCode(sgcode);
        if (!data) {
            throw new apollo_server_1.ApolloError("존재하지 않는 StoreGroupCode 입니다", values_1.ERROR_CODES.UNEXIST_STORE_CODE);
        }
        // scode를 이용하는 경우... session.storeUsers[scode] 로 접근한다
        // 만약 sgcode, scode 둘다 있는 경우에는 scode를 우선으로 접근한다.
        const storeUser = (_b = (_a = context.req.session) === null || _a === void 0 ? void 0 : _a.storeGroupUsers) === null || _b === void 0 ? void 0 : _b[sgcode];
        if (!storeUser &&
            data.signUpOption
                .acceptAnonymousUser !== true) {
            throw new apollo_server_1.ApolloError("인증되지 않았습니다.", values_1.ERROR_CODES.UNAUTHORIZED_USER);
        }
        // update여부 체크 ㄱㄱ
        const updatedStoreUser = await StoreUser_1.StoreUserModel.findOne({
            _id: new mongodb_1.ObjectId(storeUser === null || storeUser === void 0 ? void 0 : storeUser._id),
            updatedAt: {
                $gt: new Date(storeUser.updatedAt)
            }
        }).exec();
        if (updatedStoreUser) {
            context.req.session.storeGroupUsers[sgcode] = updatedStoreUser.toObject();
            context.req.session.save((err) => {
                if (err) {
                    throw new err();
                }
            });
            context.req.storeUser = updatedStoreUser.toObject();
        }
        else {
            context.req.storeUser = storeUser;
        }
        return await resolverFunction({ parent, args, context, info }, stack);
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
exports.privateResolverForInternalExec = (resolverFunction) => async ({ parent, args, context, info }, stack) => {
    try {
        // TODO: IP WriteList에 포함되는지 확인한다.
        return await resolverFunction({ parent, args, context, info }, stack);
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
//# sourceMappingURL=resolverFuncWrapper.js.map