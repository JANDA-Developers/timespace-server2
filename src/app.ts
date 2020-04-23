import cors from "cors";
import helmet from "helmet";
import logger from "morgan";
import schema from "./schema";
import { ApolloServer } from "apollo-server-express";
import express, { Express, NextFunction, Response } from "express";
import { decodeKey, decodeKeyForBuyer } from "./utils/decodeIdToken";

class App {
    public server: ApolloServer;
    public app: Express;

    constructor() {
        const path: string = process.env.GRAPHQL_ENDPOINT || "/graphql";
        const playground = Boolean(
            process.env.ENABLE_PLAYGROUND &&
                process.env.ENABLE_PLAYGROUND.toLowerCase() === "true"
                ? true
                : false
        ).valueOf();
        this.app = express();
        this.server = new ApolloServer({
            schema,
            uploads: {
                // 20MB
                maxFieldSize: 20480000
            },
            context: (ctx): any => {
                return {
                    req: ctx.req
                };
            },
            playground
        });
        this.middlewares();

        this.server.applyMiddleware({
            app: this.app,
            path,
            cors: false,
            onHealthCheck: req => {
                return new Promise((resolve, reject) => {
                    // DB상태 체크
                    // 테스트 쿼리 동작 확인
                    // Replace the `true` in this conditional with more specific checks!

                    // if (req.get("health")) {
                    resolve("Clear");
                    // } else {
                    //     reject("boooooooooooo");
                    // }
                });
            }
        });
    }

    private middlewares = (): void => {
        this.app.use(cors());
        this.app.use(helmet());
        this.useLogger();
        this.app.use(this.jwt);
        this.app.use(this.jwtForBuyer);
    };

    private useLogger = (): void => {
        logger.token("remote-addr", req => {
            const ffHeaderValue = req.headers["x-forwarded-for"];
            if (typeof ffHeaderValue === "string") {
                return ffHeaderValue;
            }
            return (
                (ffHeaderValue && ffHeaderValue[0]) ||
                req.connection.remoteAddress ||
                ""
            );
        });
        this.app.use(
            logger(
                `[:date[iso]] :remote-addr :url(:method :status) :user-agent`
            )
        );
    };

    private jwt = async (
        req: any,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const token = req.get("X-JWT") || req.get("x-jwt");
        const accessToken = req.get("X-ACCESS-JWT") || req.get("x-access-jwt");
        if (accessToken) {
            req.accessToken = accessToken;
        }
        if (token) {
            const { ok, error, data } = await decodeKey(token);
            if (!ok && error) {
                req.headers["x-jwt"] = error.code || "";
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
                req.cognitoUser = data;
            }
        } else {
            req.cognitoUser = undefined;
        }
        next();
    };

    private jwtForBuyer = async (
        req: any,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const token = req.get("X-JWT-B") || req.get("x-jwt-b");
        if (token) {
            const { ok, error, data } = await decodeKeyForBuyer(token);
            if (!ok && error) {
                req.headers["x-jwt-b"] = error.code || "";
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
                req.cognitoBuyer = data;
            }
        } else {
            req.cognitoBuyer = undefined;
        }
        next();
    };
}

export default new App().app;
