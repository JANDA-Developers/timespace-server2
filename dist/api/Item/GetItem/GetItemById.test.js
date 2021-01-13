"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_setup_1 = require("../../../jest.setup");
const apollo_server_1 = require("apollo-server");
test("GetItemById", async () => {
    const QUERY = apollo_server_1.gql `
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
    const { data } = await jest_setup_1.query({
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
//# sourceMappingURL=GetItemById.test.js.map