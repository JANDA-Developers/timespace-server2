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
const axios_1 = __importDefault(require("axios"));
const decodeIdToken_1 = require("./utils/decodeIdToken");
const typegoose_1 = require("@typegoose/typegoose");
// import { testDBUri } from "./test.uri";
class TestApp {
    constructor() {
        this.middlewares = () => {
            this.app.use(cors_1.default());
            this.app.use(helmet_1.default());
            this.useLogger();
            this.app.use(this.jwt);
        };
        this.useLogger = () => {
            morgan_1.default.token("remote-addr", req => {
                var ffHeaderValue = req.headers["x-forwarded-for"];
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
            const token = req.get("X-JWT") || req.get("x-jwt");
            if (token) {
                const { ok, error, data } = await decodeIdToken_1.decodeKey(token);
                if (!ok && error) {
                    req.headers["x-jwt"] = error.code || "";
                }
                if (data) {
                    data._id = data["custom:_id"];
                    data.zoneinfo = JSON.parse(data.zoneinfo);
                    // Raw Data임... DB에 있는 Cognito User 절대 아님
                    req.cognitoUser = data;
                }
            }
            else {
                req.cognitoUser = undefined;
            }
            next();
        };
        const path = process.env.GRAPHQL_ENDPOINT || "/graphql";
        this.app = express_1.default();
        this.server = new apollo_server_express_1.ApolloServer({
            schema: schema_1.default,
            context: (ctx) => {
                return {
                    req: ctx.req
                };
            }
        });
        this.middlewares();
        if (typegoose_1.mongoose.connections.length === 0) {
            // @ts-ignore
            typegoose_1.mongoose.createConnection("", {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true
            });
        }
        this.app.get("/", async (req, res) => {
            try {
                req.body = {
                    query: "query { HealthCheck { ok, error { code, msg } }}"
                };
                const uri = `http://${process.env.SERVER_URL}:${process.env.PORT}${path}`;
                const result = await axios_1.default.post(uri, req.body, {
                    headers: {
                        "Accept-Encoding": "gzip, deflate, br",
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Connection: "keep-alive"
                    }
                });
                res.json(result.data);
            }
            catch (error) {
                res.json({
                    ok: false,
                    error: error.message,
                    data: null
                });
            }
        });
    }
}
exports.default = new TestApp();
//# sourceMappingURL=testApp.js.map