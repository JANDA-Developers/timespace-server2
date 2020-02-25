import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { DeleteUserResponse, DeleteUserInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";

export const DeleteUserFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<DeleteUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { param }: { param: DeleteUserInput } = args;
        const { userSub, expiresAt } = param;
        const user = await UserModel.findBySub(userSub);
        await user.deleteUser(session, expiresAt || undefined);
        await user.save({
            session
        });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        DeleteUser: defaultResolver(privateResolver(DeleteUserFunc))
    }
};
export default resolvers;
