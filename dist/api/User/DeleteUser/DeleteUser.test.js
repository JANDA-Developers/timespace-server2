"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_setup_1 = require("../../../jest.setup");
const apollo_server_1 = require("apollo-server");
const DeleteUserFunc = async () => {
    const API_FUNC = apollo_server_1.gql `
        mutation {
            DeleteUser(
                param: {
                    userSub: "cd3f88be-2dde-4746-a75e-3ace9c62aa12"
                    expiresAt: "2020-02-26T12:45:00.000Z"
                }
            ) {
                ok
                error {
                    code
                    msg
                    origin
                }
            }
        }
    `;
    const { data, errors } = await jest_setup_1.mutate({ mutation: API_FUNC });
    console.info(errors);
    expect(data).toMatchObject({
        DeleteUser: {
            ok: true,
            error: null
        }
    });
};
test("DeleteUser", DeleteUserFunc);
//# sourceMappingURL=DeleteUser.test.js.map