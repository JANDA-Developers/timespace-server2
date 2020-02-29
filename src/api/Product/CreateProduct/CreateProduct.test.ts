import { mutate } from "../../../jest.setup";
import { gql } from "apollo-server";

export const CreateProductFunc = async () => {
    const API_FUNC = gql`
        mutation {
            CreateProduct(param: { }) {
                ok
                error {
                    code
                    msg
                    origin
                }
                data {
                    
                }
            }
        }
    `;
    const { data, errors } = await mutate({ mutation: API_FUNC });
    console.info(errors);
    expect(data).toMatchObject({
        CreateProduct: {
            ok: true,
            error: null,
            data: {}
        }
    });
    return data;
};

test("CreateProduct", CreateProductFunc);
