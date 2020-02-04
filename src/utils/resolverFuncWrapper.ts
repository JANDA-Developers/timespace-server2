import { fmtLog } from "../logger";
import { ApolloError } from "apollo-server";
import { getIP, getLocalDate } from "./utils";
import { ResolverFunction } from "../types/resolvers";

/**
 * 리솔버 로거... 로그 찍어주는 아이 ㅎㅎ
 * @param resolverFunction
 */
export const defaultResolver = (resolverFunction: ResolverFunction) => async (
    parent: any,
    args: any,
    context: any,
    info: any
) => {
    const startTime = new Date();
    const stack = [];
    const { headers, body, user } = context.req;
    const ips = getIP(context.req);
    let result: any;
    try {
        result = await resolverFunction({ parent, args, context, info }, stack);
    } catch (error) {
        result = {
            ok: false,
            error: {
                msg: error.message,
                code: error.code || error.extensions.code
            },
            data: null
        };
    }
    fmtLog(result.error ? "err" : "info", {
        when: {
            utc: startTime.toISOString(),
            localTime: getLocalDate(
                startTime,
                (user && parseInt(JSON.parse(user.zoneinfo).offset)) ||
                    undefined
            ).toISOString()
        },
        who: {
            ip: {
                clientIP: ips[0],
                proxys: ips.slice(1)
            },
            "X-JWT": headers["X-JWT"] || headers["x-jwt"],
            "user-agent": headers["user-agent"],
            user:
                (user && {
                    _id: user.sub,
                    email: user.email,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    phone_number: user.phone_number,
                    name: user.name,
                    exp: user.exp
                }) ||
                null
        },
        where: info.fieldName,
        data: {
            resTime: `${new Date().getTime() - startTime.getTime()} ms`,
            body,
            input: args,
            insideLog: stack,
            output: result
        }
    });
    return result;
};

export const privateResolver = (resolverFunction: ResolverFunction) => async (
    { parent, args, context, info },
    insideLog: any[]
) => {
    if (!context.req.user) {
        throw new ApolloError("Unauthorized", "UNAUTHORIZED_USER", {
            jwt: context.req.headers.jwt
        });
    }
    return await resolverFunction({ parent, args, context, info }, insideLog);
};
