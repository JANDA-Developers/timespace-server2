/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
jest.setTimeout(300000);
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
                ...req.req,
                user: {
                    _id: "5db9520bfc214c266c35207f",
                    agencyId: null,
                    isPhoneVerified: true,
                    isEmailVerified: false,
                    userRole: "ADMIN",
                    userRoles: ["HOST"],
                    checkPrivacyPolicy: false,
                    houses: [
                        "5db952a1fc214c266c352081",
                        "5de35632eef15b2f49f99d75",
                        "5de35647eef15b2f49f99d77"
                    ],
                    consignedHouses: [],
                    name: "김민재",
                    email: "crawl123@naver.com",
                    password:
                        "$2a$10$Wu8fGlK61gDA7pCXQA9qTesTzyI0wXmwpFE3wEVyH9ySi0CrSyKgW",
                    phoneNumber: "01052374492",
                    createdAt: "2019-10-30T09:04:11.391Z",
                    updatedAt: "2019-12-05T07:58:35.472Z",
                    __v: 13,
                    profileImg: {
                        url:
                            "https://s3.ap-northeast-2.amazonaws.com/storage.stayjanda.com/5db9520bfc214c266c35207f/2584cc76e618-4957-b341-766f50cfa1b4",
                        filename: "blob",
                        mimeType: "image/jpeg",
                        tags: [
                            { Key: "mimetype", Value: "image/jpeg" },
                            { Key: "filename", Value: "blob" }
                        ]
                    },
                    paymentInfos: [
                        {
                            billKey: "BIKYnictest04m1911300433097848",
                            authDate: "2019-11-30T00:00:00.000Z",
                            cardCl: 1,
                            cardNo: "46195410****2956",
                            cardName: "[신한]",
                            isLive: true,
                            __uniqueID: 1575017180721
                        }
                    ]
                }
            }
        };
    }
});

module.exports = { query, mutate } = createTestClient(server);
