import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetSmsKeyResponse } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";

export const GetSmsKeyFunc = async ({
    context: { req }
}): Promise<GetSmsKeyResponse> => {
    try {
        const { cognitoUser } = req;
        return {
            ok: true,
            error: null,
            data: cognitoUser.smsKey
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetSmsKey: defaultResolver(privateResolver(GetSmsKeyFunc))
    }
};
export default resolvers;
