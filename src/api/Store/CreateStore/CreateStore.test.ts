import { mutate } from "../../../jest.setup";
import { gql } from "apollo-server";

export const CreateStoreTestFunc = async () => {
    const API_FUNC = gql`
        mutation {
            CreateStore(
                param: {
                    name: "컨퍼런스룸 테스트"
                    type: LEASE
                    description: "테스트 설명"
                    timezone: "Asia/Seoul"
                    periodOption: { max: 180, min: 30, unit: 30 }
                    businessHours: [
                        {
                            start: 540
                            end: 1260
                            days: [MON, TUE, WED, THU, FRI, SAT, SUN]
                        }
                    ]
                    customFieldInput: [
                        {
                            label: "소속"
                            type: LIST
                            list: ["AirBNB", "Expedia"]
                        }
                        { label: "이용목적", type: STRING }
                    ]
                }
            ) {
                ok
                error {
                    code
                    msg
                }
                data {
                    _id
                    user {
                        name
                        sub
                        zoneinfo {
                            name
                            code
                            tz
                            offset
                            callingCode
                        }
                    }
                    name
                    code
                    type
                    description
                    periodOption {
                        max
                        min
                        unit
                        offset
                    }
                }
            }
        }
    `;
    const { data, errors } = await mutate({ mutation: API_FUNC });
    console.info(errors);
    expect(data).toMatchObject({
        CreateStore: {
            ok: true,
            error: null,
            data: {
                _id: expect.any(String),
                name: expect.any(String),
                code: expect.any(String),
                type: expect.any(String),
                description: expect.any(String)
            }
        }
    });
    return data && data.CreateStore;
};

test("CreateStore", CreateStoreTestFunc);
