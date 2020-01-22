import cors from "cors";
import helmet from "helmet";
import logger from "morgan";
import schema from "./schema";
import { ApolloServer } from "apollo-server-express";
import express, { Express } from "express";
import axios from "axios";
// import fs from "fs";
import { stream } from "./logger";

class App {
    public server: ApolloServer;
    public app: Express;

    constructor() {
        const path: string = process.env.GRAPHQL_ENDPOINT || "/graphql";
        const playground = Boolean(process.env.ENABLE_PLAYGROUND).valueOf();
        this.app = express();
        this.server = new ApolloServer({
            schema,
            context: (req): any => {
                return {
                    req: req.req
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
                            "X-JWT": req.headers["x-jwt"],
                            "HP-Key": req.headers["hp-key"],
                            "HM-Key": req.headers["hm-key"],
                            "JDH-T": req.headers["jdh-t"]
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
    };

    private useLogger = (): void => {
        this.app.use(
            logger(
                `{"DATE": ":date", "IP": ":remote-addr", "METHOD": ":method", "URL": ":url", "STATUS": ":status"}`,
                {
                    stream
                    // stream: fs.createWriteStream("app.log", { flags: "w" })
                }
            )
        );
    };
}

export default new App().app;
