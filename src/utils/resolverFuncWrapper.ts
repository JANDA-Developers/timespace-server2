import { fmtLog } from "../logger";
import { ApolloError } from "apollo-server";
import { getIP, getLocalDate } from "./utils";

/**
 * 리솔버 로거... 로그 찍어주는 아이 ㅎㅎ
 * @param resolverFunction
 */
export const defaultResolver = resolverFunction => async (
    parent: any,
    args: any,
    context: any,
    info: any
) => {
    const startTime = new Date();
    const logInfoArr = [];
    const { headers, body, user } = context.req;
    const ips = getIP(context.req);
    let result: any;
    try {
        result = await resolverFunction(
            logInfoArr,
            parent,
            args,
            context,
            info
        );
    } catch (error) {
        // console.log(error);
        result = {
            ok: false,
            error,
            data: null
        };
    }
    fmtLog(result.error ? "err" : "info", {
        when: {
            utc: startTime.toISOString(),
            localTime: getLocalDate(
                startTime,
                (user && user.zoneinfo.offset) || undefined
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
            insideLog: logInfoArr,
            output: result
        }
    });
    return result;
};

export const privateResolver = resolverFunction => async (
    insideLog: any[],
    parent: any,
    args: any,
    context: any,
    info: any
) => {
    if (!context.req.user) {
        throw new ApolloError("Unauthorized", "UNAUTHORIZED_USER", {
            jwt: context.req.headers.jwt
        });
    }
    return await resolverFunction(insideLog, parent, args, context, info);
};
