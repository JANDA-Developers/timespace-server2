import { mutate } from "../../../jest.setup";
import { gql } from "apollo-server";

export const EmailSignInFunc = async () => {
    const API_FUNC = gql`
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
    const { data } = await mutate({ mutation: API_FUNC });
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

test("EmailSignIn", EmailSignInFunc);
