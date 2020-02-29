import { Resolvers } from "../../../types/resolvers";
import {
    privateResolver,
    defaultResolver
} from "../../../utils/resolverFuncWrapper";
import { GetMyProfileResponse } from "GraphType";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    Query: {
        GetMyProfile: defaultResolver(
            privateResolver(
                async ({ context: { req } }): Promise<GetMyProfileResponse> => {
                    try {
                        const { cognitoUser } = req;

                        const user = await UserModel.findUser(cognitoUser);
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
