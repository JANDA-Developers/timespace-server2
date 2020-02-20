import { query } from "../../../jest.setup";
import { gql } from "apollo-server";

test("GetItemById", async () => {
    const QUERY = gql`
        query {
            GetItemById(param: { itemId: "" }): {
                ok
                error {
                    code
                    msg
                }
                data {
                    _id
                    buyer {
                        _id
                        name
                    }
                }
            }
        }
    `;
    const { data } = await query({
        query: QUERY
    });
    expect(data).toMatchObject({
        ok: true,
        error: null,
        data: {
            _id: expect.anything(),
            buyer: {
                _id: expect.anything(),
                name: expect.any(String)
            }
        }
    });
});
