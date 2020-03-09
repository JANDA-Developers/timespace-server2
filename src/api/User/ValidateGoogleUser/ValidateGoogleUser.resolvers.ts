import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ValidateGoogleUserResponse,
    ValidateGoogleUserResult
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";

export const ValidateGoogleUserFunc = async ({
    args,
    context: { req }
}): Promise<ValidateGoogleUserResponse> => {
    try {
        const { cognitoUser } = req;
        const data: ValidateGoogleUserResult = {
            isInitiated: false
        };
        const user = await UserModel.findOne({
            sub: cognitoUser.sub
        });

        if (!user) {
            return {
                ok: true,
                error: null,
                data
            };
        }

        if (new ObjectId(cognitoUser["custom:_id"]).equals(user._id)) {
            data.isInitiated = true;
        }

        console.log({
            cognitoUser,
            data
        });
        return {
            ok: true,
            error: null,
            data
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Query: {
        ValidateGoogleUser: defaultResolver(
            privateResolver(ValidateGoogleUserFunc)
        )
    }
};
export default resolvers;
