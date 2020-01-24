import { gql } from "apollo-server";

test("EmailSignUp", async () => {
    const query = gql`
        mutation {
            EmailSignUp(param: {}) {
                ok
                error
                data
            }
        }
    `;
    console.log(query);
});
