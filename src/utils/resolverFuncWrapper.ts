import { fmtLog } from "../logger";
import { ErrCls } from "../models/Err";

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
    const { headers, body, ip, user } = context.req;
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
        result = {
            ok: false,
            error: JSON.parse(error.message),
            data: null
        };
    }
    fmtLog(result.error ? "err" : "info", {
        when: startTime.toISOString(),
        who: {
            ip,
            "user-agent": headers["user-agent"],
            user: {
                _id: user.sub,
                email: user.email,
                // eslint-disable-next-line @typescript-eslint/camelcase
                phone_number: user.phone_number,
                name: user.name
            }
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
        throw ErrCls.makeErr("101", "Unauthorized");
    }
    return await resolverFunction(insideLog, parent, args, context, info);
};
