"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const schema_1 = __importDefault(require("./schema"));
const apollo_server_express_1 = require("apollo-server-express");
const express_1 = __importDefault(require("express"));
const decodeIdToken_1 = require("./utils/decodeIdToken");
const express_session_1 = __importDefault(require("express-session"));
const typegoose_1 = require("@typegoose/typegoose");
const dateFuncs_1 = require("./utils/dateFuncs");
const refreshToken_1 = require("./utils/refreshToken");
const User_1 = require("./models/User");
const Buyer_1 = require("./models/Buyer");
const MongoStore = require("connect-mongo")(express_session_1.default);
class App {
    constructor() {
        this.corsOrigin = [
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
        this.middlewares = () => {
            console.count("call occur");
            this.app.use(cors_1.default({
                credentials: true,
                origin: this.corsOrigin
            }));
            this.app.set("trust procy", true);
            this.app.use(helmet_1.default());
            // MongoDB for Session Storage
            this.app.use(express_session_1.default({
                name: "qid",
                secret: process.env.JD_TIMESPACE_SECRET || "",
                resave: false,
                saveUninitialized: false,
                store: new MongoStore({
                    mongooseConnection: typegoose_1.mongoose.connection
                }),
                cookie: {
                    httpOnly: true,
                    secure: true,
                    domain: ".stayjanda.cloud",
                    sameSite: "lax",
                    maxAge: dateFuncs_1.ONE_DAY * 14
                }
            }));
            this.app.use((req, res, next) => {
                res.set("version", "1.0.5");
                next();
            });
            this.useLogger();
            this.app.use(this.jwt);
            this.app.use(this.jwtForBuyer);
            this.app.use(this.parseStoreGroupCode);
        };
        this.useLogger = () => {
            morgan_1.default.token("remote-addr", req => {
                const ffHeaderValue = req.headers["x-forwarded-for"];
                if (typeof ffHeaderValue === "string") {
                    return ffHeaderValue;
                }
                return ((ffHeaderValue && ffHeaderValue[0]) ||
                    req.connection.remoteAddress ||
                    "");
            });
            this.app.use(morgan_1.default(`[:date[iso]] :remote-addr :url(:method :status) :user-agent`));
        };
        this.jwt = async (req, res, next) => {
            var _a, _b, _c, _d;
            const seller = (_a = req.session) === null || _a === void 0 ? void 0 : _a.seller;
            const token = seller === null || seller === void 0 ? void 0 : seller.idToken;
            if (token) {
                const expiresAt = parseInt((_c = (_b = req.session) === null || _b === void 0 ? void 0 : _b.seller) === null || _c === void 0 ? void 0 : _c.expiresIn);
                const now = Date.now();
                // TODO: Refresh Token...
                const { data } = await decodeIdToken_1.decodeKey(token);
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
                    if (expiresAt - now <= 15 * dateFuncs_1.ONE_MINUTE) {
                        console.log({
                            expIsin: true
                        });
                        const rToken = (await User_1.UserModel.findUser(data))
                            .refreshToken;
                        const { ok, data: result } = await refreshToken_1.refreshToken(rToken, "SELLER");
                        if (ok && result) {
                            console.log({
                                result
                            });
                            if (req.session) {
                                req.session.seller = {
                                    idToken: result.idToken,
                                    expiresIn: (_d = result.expDate) === null || _d === void 0 ? void 0 : _d.getTime(),
                                    accessToken: result.accessToken
                                };
                                req.session.save(err => {
                                    console.log("Session Saved!!");
                                });
                            }
                        }
                    }
                }
            }
            else {
                req["cognitoUser"] = undefined;
            }
            next();
        };
        this.jwtForBuyer = async (req, res, next) => {
            var _a, _b, _c, _d;
            const buyer = (_a = req.session) === null || _a === void 0 ? void 0 : _a.buyer;
            const token = buyer === null || buyer === void 0 ? void 0 : buyer.idToken;
            if (token) {
                const expiresAt = parseInt((_c = (_b = req.session) === null || _b === void 0 ? void 0 : _b.buyer) === null || _c === void 0 ? void 0 : _c.expiresIn);
                const now = Date.now();
                // TODO: Refresh Token...
                console.log({ buyer });
                const { data } = await decodeIdToken_1.decodeKeyForBuyer(token);
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
                    if (expiresAt - now <= 15 * dateFuncs_1.ONE_MINUTE) {
                        const rToken = (await Buyer_1.BuyerModel.findBuyer(data))
                            .refreshToken;
                        const { ok, data: result } = await refreshToken_1.refreshToken(rToken, "BUYER");
                        if (ok && result) {
                            if (req.session) {
                                req.session.buyer = {
                                    idToken: result.idToken,
                                    expiresIn: (_d = result.expDate) === null || _d === void 0 ? void 0 : _d.getTime(),
                                    accessToken: result.accessToken
                                };
                                req.session.save(err => {
                                    console.log("Session Saved!!");
                                });
                            }
                        }
                    }
                }
            }
            else {
                req["cognitoBuyer"] = undefined;
            }
            next();
        };
        this.parseStoreGroupCode = async (req, res, next) => {
            req["sgcode"] = req.get("sgcode");
            next();
        };
        const path = process.env.GRAPHQL_ENDPOINT || "/graphql";
        const playground = Boolean(process.env.ENABLE_PLAYGROUND &&
            process.env.ENABLE_PLAYGROUND.toLowerCase() === "true"
            ? true
            : false).valueOf();
        this.app = express_1.default();
        this.server = new apollo_server_express_1.ApolloServer({
            schema: schema_1.default,
            uploads: {
                // 20MB
                maxFieldSize: 20480000
            },
            context: (ctx) => {
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
}
exports.default = new App().app;
//# sourceMappingURL=app.js.map