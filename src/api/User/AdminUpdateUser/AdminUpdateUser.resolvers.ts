import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { AdminUpdateUserResponse, AdminUpdateUserInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { UserModel } from "../../../models/User";

export const AdminUpdateUserFunc = async ({
    args
}): Promise<AdminUpdateUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // TODO: 참고...
        // https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminUpdateUserAttributes.html
        const { param }: { param: AdminUpdateUserInput } = args;
        const user = await UserModel.findBySub(param.userSub);
        const { updateParam } = param;
        for (const key in updateParam) {
            const factor = updateParam[key];

            user[key] = factor;
        }

        await user.save();
        await session.commitTransaction();
        session.endSession();
        throw new ApolloError("개발중", ERROR_CODES.UNDERDEVELOPMENT);
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        AdminUpdateUser: defaultResolver(privateResolver(AdminUpdateUserFunc))
    }
};
export default resolvers;
