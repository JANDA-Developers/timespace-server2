import { query } from "../../../jest.setup";
import { gql } from "apollo-server";
test("HealthCheck", async () => {
    const q = gql`
        {
            HealthCheck {
                ok
                error {
                    code
                    msg
                }
            }
        }
    `;
    const { data } = await query({
        query: q
    });
    expect(data).toEqual({
        HealthCheck: {
            ok: true,
            error: null
        }
    });
});
