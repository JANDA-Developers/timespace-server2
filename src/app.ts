import cors from "cors";
import helmet from "helmet";
import logger from "morgan";
import schema from "./schema";
import { ApolloServer } from "apollo-server-express";
import express, { Express, NextFunction, Response } from "express";
import axios from "axios";
import { decodeKey } from "./utils/decodeIdToken";

class App {
    public server: ApolloServer;
    public app: Express;

    constructor() {
        const path: string = process.env.GRAPHQL_ENDPOINT || "/graphql";
        const playground = Boolean(process.env.ENABLE_PLAYGROUND).valueOf();
        this.app = express();
        this.server = new ApolloServer({
            schema,
            context: (ctx): any => {
                console.log(ctx.req.originalUrl);
                console.log(ctx.req.ip);

                return {
                    req: ctx.req
                };
            },
            playground
        });
        this.middlewares();

        this.app.get("/", async (req, res) => {
            try {
                req.body = {
                    query: "query { HealthCheck { ok, error }}"
                };
                const result = await axios.post(
                    `http://${process.env.SERVER_URL}:${process.env.PORT}${path}`,
                    req.body,
                    {
                        headers: {
                            "Accept-Encoding": "gzip, deflate, br",
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            Connection: "keep-alive",
                            "X-JWT": req.headers["x-jwt"]
                        }
                    }
                );
                res.json(result.data);
            } catch (error) {
                console.info(error);
                res.json({
                    ok: false,
                    error: error.message,
                    data: null
                });
            }
        });
        this.server.applyMiddleware({ app: this.app, path });
    }

    private middlewares = (): void => {
        this.app.use(cors());
        this.app.use(helmet());
        this.useLogger();
        this.app.use(this.jwt);
    };

    private useLogger = (): void => {
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
        const token = req.get("X-JWT");

        if (token) {
            const user = await decodeKey(token);
            req.user = user;
        } else {
            req.user = undefined;
        }
        next();
    };
}

export default new App().app;
