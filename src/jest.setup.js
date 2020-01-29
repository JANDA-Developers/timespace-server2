/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
jest.setTimeout(15000);
const dotenv = require("dotenv");
dotenv.config({
    path: "./.env"
});

const ApolloServer = require("apollo-server").ApolloServer;
const createTestClient = require("apollo-server-testing").createTestClient;
const schema = require("./schema").default;
const mongoose = require("mongoose");
const { testDBUri } = require("./test.uri");
// const app = require("./src/app");

// import { exec } from "child_process";
// import util from "util";

mongoose.connect(testDBUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    // dbName: DB_NAME,
    autoReconnect: true
});
// .then(() => {
//     console.log(`DB Uri: ${testDBUri}`);
// })
// .catch(err => {
//     console.log(err);
// });

const server = new ApolloServer({
    schema,
    context: req => {
        return {
            req: {
                ...req.req
            }
        };
    }
});

module.exports = { query, mutate } = createTestClient(server);
