import { gql } from "apollo-server";
import { mutate } from "../../../jest.setup";

/**
 * 회원가입 테스트 Func
 * @param obj email, timezone, phoneNumner, password, username => string 으로 ㄱㄱ
 */
export const emailSignUpTestFunc = async (obj?: any) => {
    const variables = {
        email: "dfscodeslave@gmail.com",
        timezone: "Asia/Seoul",
        phoneNumber: "+821081208523",
        password: "akstnp12!@",
        username: "배경열",
        ...obj
    };
    const query = gql`
        mutation {
            EmailSignUp(
                param: {
                    email: ${variables.email}
                    timezone: ${variables.timezone}
                    phoneNumber: ${variables.phoneNumber}
                    password: ${variables.password}
                    username: ${variables.username}
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
    const { data } = await mutate({
        mutation: query
    });
    expect(data).toMatchObject({
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
    });
    return data;
};

test("EmailSignUp", emailSignUpTestFunc);
