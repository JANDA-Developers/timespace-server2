import { gql } from "apollo-server";
import { mutate } from "../../../jest.setup";

export const emailSignUpTestFunc = async () => {
    const query = gql`
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
