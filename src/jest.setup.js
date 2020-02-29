/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
jest.setTimeout(6000);
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
if (!mongoose.connections.length) {
    mongoose.connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
        {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        }
    );
}
// .then(() => {
//     console.log(`DB Uri: ${testDBUri}`);
// })
// .catch(err => {
//     console.log(err);
// });

const token =
    "eyJraWQiOiIzZ0JzbHZUVFwvOEZuM1hlSEpWR1lMZVExcFp0OUo0Q2NBTHBUNXNmUE83UT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI4Zjc2NWYyOC1mZmVhLTQyNDctOTI1ZS05ZmQ4ODJlMmEyMzAiLCJ6b25laW5mbyI6IntcIm5hbWVcIjpcIktvcmVhLCBSZXB1YmxpYyBvZlwiLFwidHpcIjpcIkFzaWFcL1Nlb3VsXCIsXCJjb2RlXCI6XCJLUlwiLFwib2Zmc2V0XCI6OSxcImNhbGxpbmdDb2RlXCI6XCIrODJcIn0iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLW5vcnRoZWFzdC0yLmFtYXpvbmF3cy5jb21cL2FwLW5vcnRoZWFzdC0yXzFRaldDOUtwMSIsInBob25lX251bWJlcl92ZXJpZmllZCI6ZmFsc2UsImNvZ25pdG86dXNlcm5hbWUiOiI4Zjc2NWYyOC1mZmVhLTQyNDctOTI1ZS05ZmQ4ODJlMmEyMzAiLCJhdWQiOiI2ZHRudHJ2dmFyZGJwMWRxbWNubWhtbXNqaCIsImV2ZW50X2lkIjoiZTcwZGRlNGEtYjZkYy00MjEzLTk0YTUtYjIxODViMzY1N2U0IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE1ODI3NDUxMzgsIm5hbWUiOiLrsLDqsr3sl7QiLCJjdXN0b206aXNCdXllciI6IjEiLCJwaG9uZV9udW1iZXIiOiIrODIwMTA4MTIwODUyMyIsImN1c3RvbTppc1NlbGxlciI6IjEiLCJjdXN0b206X2lkIjoiNWU1NjcyZTM3MGQ4OTI0OGIwODU1ZWY1IiwiZXhwIjoxNTgyNzQ4NzM4LCJpYXQiOjE1ODI3NDUxMzgsImVtYWlsIjoiZGZzY29kZXNsYXZlQGdtYWlsLmNvbSJ9.u-8UPU8yoYbhFG8lZPqiLFERnGY2AvnRP0tDP2EnCpVY-9m_s1fRvISZbRba-ZtvKzoY-UM48r1zljU1FGBBFIxdJFJMxbDGGeEeAfrQqVorkQOMIJ9Jcfn-qGOnYm52Ts5rDe8OBGuz7HgtWZMenqdpUQk-MF2rm9N7Z0AhfxPpf-EJgqZP49VFoyfiU9dlH7G3HBXhcCq8qacYJP-K6CnjcH6rl7Pdh3_7CG7JvbR-cSivvasxb9rUIzYcQzazio_ysa1csvzWHUSjI0aBvpWDvUrq5NWByPFPyFekimzCf088_wPtbgiO71FFeoOEZstHacXT0elgwb0cUi2hog";

const server = new ApolloServer({
    schema,
    context: ctx => {
        const req = {
            req: {
                ...ctx.req,
                headers: {
                    host: "localhost:4000",
                    "x-forwarded-for": "112.185.59.229, 10.0.4.151",
                    "x-forwarded-proto": "https",
                    "x-forwarded-port": "443",
                    "x-amzn-trace-id":
                        "Root=1-5e56731e-21cd2cccf614b49e60e177ac",
                    accept: "*/*",
                    "sec-fetch-dest": "empty",
                    "x-jwt": token,
                    "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36",
                    "content-type": "application/json",
                    origin: "https://dev-ticket-yeulbep6p.stayjanda.cloud",
                    "sec-fetch-site": "same-origin",
                    "sec-fetch-mode": "cors",
                    referer:
                        "https://dev-ticket-yeulbep6p.stayjanda.cloud/request_client_api",
                    "accept-encoding": "gzip, deflate, br",
                    "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                    "x-forwarded-host": "dev-ticket-yeulbep6p.stayjanda.cloud",
                    "x-forwarded-server":
                        "ip-10-0-2-95.ap-northeast-2.compute.internal",
                    connection: "Keep-Alive",
                    "content-length": "1837"
                },
                get: key => {
                    return token;
                },
                cognitoUser: {
                    sub: "8f765f28-ffea-4247-925e-9fd882e2a230",
                    zoneinfo: {
                        name: "Korea, Republic of",
                        tz: "Asia/Seoul",
                        code: "KR",
                        offset: 9,
                        callingCode: "+82"
                    },
                    email_verified: true,
                    iss:
                        "https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_1QjWC9Kp1",
                    phone_number_verified: false,
                    "cognito:username": "8f765f28-ffea-4247-925e-9fd882e2a230",
                    aud: "6dtntrvvardbp1dqmcnmhmmsjh",
                    event_id: "4de5ed38-e48e-47e3-bbc9-c202997d3ce8",
                    token_use: "id",
                    auth_time: 1582723850,
                    name: "배경열",
                    "custom:isBuyer": "1",
                    phone_number: "+8201081208523",
                    "custom:isSeller": "1",
                    "custom:_id": "5e5672e370d89248b0855ef5",
                    exp: 1582727450,
                    iat: 1582723850,
                    email: "dfscodeslave@gmail.com",
                    _id: "5e5672e370d89248b0855ef5"
                }
            }
        };
        return req;
    }
});

module.exports = { query, mutate } = createTestClient(server);
