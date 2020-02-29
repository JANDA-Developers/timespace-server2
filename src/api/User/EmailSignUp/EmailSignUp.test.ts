import { gql } from "apollo-server";
import { mutate } from "../../../jest.setup";

/**
 * 회원가입 테스트 Func
 * @param obj email, timezone, phoneNumner, password, username => string 으로 ㄱㄱ
 */
export const emailSignUpTestFunc = async () => {
    const mutation = gql`
        mutation {
            EmailSignUp(
                param: {
                    email: "dfscodeslave@gmail.com"
                    timezone: "Asia/Seoul"
                    phoneNumber: "+8201081208523"
                    password: "akstnp12!@"
                    username: "배경열"
                    roles: [SELLER, BUYER]
                }
            ) {
                ok
                error {
                    code
                    msg
                }
                data {
                    CodeDeliveryDetails {
                        AttributeName
                        DeliveryMedium
                        Destination
                    }
                    UserConfirmed
                    UserSub
                }
            }
        }
    `;

    const { data, errors } = await mutate({
        mutation
    });
    if (errors) {
        errors.forEach(e => {
            for (const key in e) {
                if (e.hasOwnProperty(key)) {
                    const element = e[key];
                    console.info(`${key}: ${JSON.stringify(element)}`);
                }
            }
        });
    }
    expect(data).toMatchObject({
        EmailSignUp: {
            ok: true,
            error: null,
            data: {
                CodeDeliveryDetails: {
                    AttributeName: expect.anything(),
                    DeliveryMedium: expect.anything(),
                    Destination: expect.anything()
                },
                UserConfirmed: false,
                UserSub: expect.any(String)
            }
        }
    });
    return data;
};

test("EmailSignUp", emailSignUpTestFunc);
