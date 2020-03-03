import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetMyProfileResponse } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";

export const GetMyProfileFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetMyProfileResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const { cognitoUser } = req;
    try {
        const user = await UserModel.findUser(cognitoUser);
        return {
            ok: true,
            error: null,
            data: {
                user: user as any
            }
        };
    } catch (error) {
        stack.push({
            cognitoUser
        });
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetMyProfile: defaultResolver(privateResolver(GetMyProfileFunc))
    }
};
export default resolvers;
