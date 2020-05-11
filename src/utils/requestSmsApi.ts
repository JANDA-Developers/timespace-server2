import { ApolloError } from "apollo-server";
import Axios from "axios";

export const requestApi = async (
    edge: string,
    query: string,
    variables?: any,
    headers?: any
) => {
    const queryResult = await Axios.post(
        edge,
        {
            query,
            variables
        },
        {
            headers: {
                "Content-Type": "application/json",
                ...headers
            }
        }
    );

    if (queryResult.status !== 200) {
        throw new ApolloError(
            "Axios 통신 실패",
            "REQUEST_FAIL",
            queryResult.data
        );
    }
    const result = queryResult.data.data;
    return result;
};
