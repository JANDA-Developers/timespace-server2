"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProductFunc = void 0;
const jest_setup_1 = require("../../../jest.setup");
const apollo_server_1 = require("apollo-server");
exports.CreateProductFunc = async () => {
    const API_FUNC = apollo_server_1.gql `
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
    const { data, errors } = await jest_setup_1.mutate({ mutation: API_FUNC });
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
test("CreateProduct", exports.CreateProductFunc);
//# sourceMappingURL=CreateProduct.test.js.map