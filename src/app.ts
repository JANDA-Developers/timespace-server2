import cors from "cors";
import helmet from "helmet";
import logger from "morgan";
import schema from "./schema";
import { ApolloServer } from "apollo-server-express";
import express, { Express, NextFunction, Response } from "express";
import { decodeKey, decodeKeyForBuyer } from "./utils/decodeIdToken";
import session from "express-session";
import { mongoose } from "@typegoose/typegoose";
import { ONE_MINUTE } from "./utils/dateFuncs";
import { refreshToken } from "./utils/refreshToken";
import { UserModel } from "./models/User";

const MongoStore = require("connect-mongo")(session);

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
        // MongoDB for Session Storage
        this.app.use(
            session({
                name: "qid",
                secret: process.env.JD_TIMESPACE_SECRET || "",
                resave: false,
                saveUninitialized: false,
                store: new MongoStore({
                    mongooseConnection: mongoose.connection
                })
            })
        );
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
        const seller = req.session.seller;
        console.log({ seller });
        const token = seller?.idToken;
        if (token) {
            const expiresAt = parseInt(req.session.expiresIn);
            const now = Date.now();
            // TODO: Refresh Token...
            const { ok, error, data } = await decodeKey(token);
            if (!ok && error) {
                req.headers["x-jwt"] = error.code || "";
            }
            if (data) {
                // set "_id", "zoneinfo"
                if (data["custom:_id"]) {
                    data._id = data["custom:_id"];
                    if (data.zoneinfo) {
                        data.zoneinfo = JSON.parse(data.zoneinfo);
                    }
                    // 여기서 세팅 요망
                }
                // Raw Data임... DB에 있는 Cognito User 절대 아님
                req.cognitoUser = data;

                if (expiresAt - now <= 10 * ONE_MINUTE) {
                    console.log({
                        expIsin: true
                    });
                    const rToken = (await UserModel.findUser(data))
                        .refreshToken;
                    const { ok, data: result } = await refreshToken(
                        rToken,
                        "SELLER"
                    );
                    console.log({ rToken });
                    if (ok && result) {
                        console.log({
                            result
                        });
                        req.session.seller = {
                            idToken: result.idToken,
                            expiresIn: result.expDate?.getTime(),
                            accessToken: result.accessToken
                        };
                    }
                }
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
        const buyer = req.session.buyer;
        const token = buyer?.idToken;
        if (token) {
            const expiresAt = parseInt(req.session.expiresIn);
            const now = Date.now();
            // TODO: Refresh Token...
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

                if (expiresAt - now <= 10 * ONE_MINUTE) {
                    const rToken = (await UserModel.findUser(data))
                        .refreshToken;
                    const { ok, data: result } = await refreshToken(
                        rToken,
                        "SELLER"
                    );
                    if (ok && result) {
                        req.session.seller = {
                            idToken: result.idToken,
                            expiresIn: result.expDate?.getTime(),
                            accessToken: result.accessToken
                        };
                    }
                }
            }
        } else {
            req.cognitoBuyer = undefined;
        }
        next();
    };
}

export default new App().app;
