import { Resolvers } from "../../../types/resolvers";
import {
    privateResolver,
    defaultResolver
} from "../../../utils/resolverFuncWrapper";
import { GetMyProfileResponse } from "../../../types/graph";

const resolvers: Resolvers = {
    Query: {
        GetMyProfile: defaultResolver(
            privateResolver(
                async ({ context: { req } }): Promise<GetMyProfileResponse> => {
                    try {
                        const { cognitoUser } = req;
                        // insideLog.push(user);
                        return {
                            ok: true,
                            error: null,
                            data: {
                                user: cognitoUser as any
                            }
                        };
                    } catch (error) {
                        return {
                            ok: false,
                            error,
                            data: null
                        };
                    }
                }
            )
        )
    }
};

export default resolvers;
