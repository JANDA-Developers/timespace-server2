import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.join(__dirname, `../.env`)
});

import app from "./app";
import { mongoose } from "@typegoose/typegoose";
import { DB_URI } from "./types/values";

const port = parseInt(process.env.PORT || "4000");

// const dbUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose
    .connect(process.env.DB_URI || DB_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then(() => {
        app.listen({ port }, () => {
            console.log(`DB Connection: ${DB_URI}`);
            console.log(
                `server listening at: http://${process.env.SERVER_URL}:${port}${process.env.GRAPHQL_ENDPOINT}`
            );
        });
    })
    .catch(err => {
        console.log(err);
    });
