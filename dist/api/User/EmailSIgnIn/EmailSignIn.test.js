"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSignInFunc = void 0;
const jest_setup_1 = require("../../../jest.setup");
const apollo_server_1 = require("apollo-server");
exports.EmailSignInFunc = async () => {
    const API_FUNC = apollo_server_1.gql `
        mutation {
            EmailSignIn(
                param: {
                    email: "dfscodeslave@gmail.com"
                    password: "akstnp12!@"
                }
            ) {
                ok
                error {
                    code
                    msg
                    origin
                }
                data {
                    token
                    expiresIn
                }
            }
        }
    `;
    const { data } = await jest_setup_1.mutate({ mutation: API_FUNC });
    expect(data).toMatchObject({
        EmailSignIn: {
            ok: true,
            error: null,
            data: {
                token: expect.any(String),
                expiresIn: expect.any(Date)
            }
        }
    });
    return data;
};
test("EmailSignIn", exports.EmailSignInFunc);
//# sourceMappingURL=EmailSignIn.test.js.map