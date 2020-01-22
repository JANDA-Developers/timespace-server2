import dotenv from "dotenv";

const env = (process.env.NODE_ENV || "development").trim();
console.log(`Env: ${env}`);
dotenv.config({
    path: "../.env"
});
// import mongoose from "mongoose";
import app from "./app";
import { mongoose } from "@typegoose/typegoose";
// import fs from "fs";

const isDev: boolean = process.env.NODE_ENV === "development";

const port = parseInt(process.env.PORT || "4000");

const dbUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose
    .connect(process.env.DB_URI || dbUri, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then(() => {
        if (isDev) {
            console.log("Env: Development");
            // console.info(connection.models);
        }
        app.listen({ port }, () => {
            console.log(`DB Connection: ${dbUri}`);
            console.log(
                `server listening at: http://${process.env.SERVER_URL}:${port}${process.env.GRAPHQL_ENDPOINT}`
            );
        });
    })
    .catch(err => {
        console.log(err);
    });
