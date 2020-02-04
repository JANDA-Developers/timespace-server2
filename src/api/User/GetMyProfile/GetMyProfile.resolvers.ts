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
                async (
                    { parent, args, context: { req } },
                    insideLog: any[]
                ): Promise<GetMyProfileResponse> => {
                    try {
                        const { user } = req;
                        // insideLog.push(user);
                        return {
                            ok: true,
                            error: null,
                            data: {
                                user: user as any
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
