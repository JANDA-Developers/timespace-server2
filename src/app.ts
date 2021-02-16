import cors from "cors";
import helmet from "helmet";
import logger from "morgan";
import schema from "./schema";
import { ApolloServer } from "apollo-server-express";
import express, { Express, NextFunction, Response, Request } from "express";
import { decodeKey, decodeKeyForBuyer } from "./utils/decodeIdToken";
import session from "express-session";
import { mongoose } from "@typegoose/typegoose";
import { ONE_MINUTE, ONE_DAY } from "./utils/dateFuncs";
import { refreshToken } from "./utils/refreshToken";
import { UserModel } from "./models/User";
import { BuyerModel } from "./models/Buyer";

const MongoStore = require("connect-mongo")(session);

class App {
    public server: ApolloServer;
    public app: Express;

    private corsOrigin: string[] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4001",
        "http://localhost:80",
        "https://dev-ticket-yeulbep6p.stayjanda.cloud",
        "https://space.stayjanda.cloud",
        "https://manager.space.stayjanda.cloud",
        "https://storeuser.space.stayjanda.cloud",
        "https://dev.timespace.stayjanda.cloud"
    ];

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
            cors: {
                credentials: true,
                origin: this.corsOrigin
            },
            path,
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
        console.count("call occur");
        this.app.use(
            cors({
                credentials: true,
                origin: this.corsOrigin
            })
        );
        this.app.set("trust procy", true);
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
                }),
                cookie: {
                    httpOnly: true,
                    secure: "auto",
                    domain: ".stayjanda.cloud",
                    sameSite: "lax",
                    maxAge: ONE_DAY * 14
                }
            })
        );
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.set("version", "1.0.0");
            next();
        });
        this.useLogger();
        this.app.use(this.jwt);
        this.app.use(this.jwtForBuyer);
        this.app.use(this.parseStoreGroupCode);
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
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const seller = req.session?.seller;
        const token = seller?.idToken;
        if (token) {
            const expiresAt = parseInt(req.session?.seller?.expiresIn);
            const now = Date.now();
            // TODO: Refresh Token...
            const { data } = await decodeKey(token);
            if (data) {
                // set "_id", "zoneinfo"
                if (data["custom:_id"]) {
                    data._id = data["custom:_id"];
                    if (data.zoneinfo) {
                        data.zoneinfo = JSON.parse(data.zoneinfo);
                    }
                    // 여기서 세팅 요망
                }
                // res.cookie("seller");
                // Raw Data임... DB에 있는 Cognito User 절대 아님
                req["cognitoUser"] = data;

                if (expiresAt - now <= 15 * ONE_MINUTE) {
                    console.log({
                        expIsin: true
                    });
                    const rToken = (await UserModel.findUser(data))
                        .refreshToken;
                    const { ok, data: result } = await refreshToken(
                        rToken,
                        "SELLER"
                    );
                    if (ok && result) {
                        console.log({
                            result
                        });
                        if (req.session) {
                            req.session.seller = {
                                idToken: result.idToken,
                                expiresIn: result.expDate?.getTime(),
                                accessToken: result.accessToken
                            };
                            req.session.save(err => {
                                console.log("Session Saved!!");
                            });
                        }
                    }
                }
            }
        } else {
            req["cognitoUser"] = undefined;
        }
        next();
    };

    private jwtForBuyer = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const buyer = req.session?.buyer;
        const token = buyer?.idToken;
        if (token) {
            const expiresAt = parseInt(req.session?.buyer?.expiresIn);
            const now = Date.now();
            // TODO: Refresh Token...
            console.log({ buyer });
            const { data } = await decodeKeyForBuyer(token);

            if (data) {
                if (data["custom:_id"]) {
                    data._id = data["custom:_id"];
                    if (data.zoneinfo) {
                        data.zoneinfo = JSON.parse(data.zoneinfo);
                    }
                    // 여기서 세팅 요망
                }
                // Raw Data임... DB에 있는 Cognito User 절대 아님
                req["cognitoBuyer"] = data;

                if (expiresAt - now <= 15 * ONE_MINUTE) {
                    const rToken = (await BuyerModel.findBuyer(data))
                        .refreshToken;
                    const { ok, data: result } = await refreshToken(
                        rToken,
                        "BUYER"
                    );
                    if (ok && result) {
                        if (req.session) {
                            req.session.buyer = {
                                idToken: result.idToken,
                                expiresIn: result.expDate?.getTime(),
                                accessToken: result.accessToken
                            };
                            req.session.save(err => {
                                console.log("Session Saved!!");
                            });
                        }
                    }
                }
            }
        } else {
            req["cognitoBuyer"] = undefined;
        }
        next();
    };

    private parseStoreGroupCode = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        req["sgcode"] = req.get("sgcode");
        next();
    };
}

export default new App().app;
