import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ChangeStoreUsersPasswordResponse,
    ChangeStoreUsersPasswordMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreUserModel } from "../../../models/StoreUser";

export const ChangeStoreUsersPasswordFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ChangeStoreUsersPasswordResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: userDoc } = req;
        const {
            oldPassword,
            newPassword
        } = args as ChangeStoreUsersPasswordMutationArgs;
        const storeUser = await StoreUserModel.findById(userDoc._id);
        if (!storeUser) {
            throw new Error("존재하지 않는 storeUser");
        }
        const correctPassword = storeUser.comparePassword(oldPassword);
        if (!correctPassword) {
            throw new ApolloError(
                "패스워드를 확인해주세요.",
                ERROR_CODES.PASSWORD_COMPARE_ERROR
            );
        }
        storeUser.password = newPassword;
        await storeUser.hashPassword();
        await storeUser.save({ session });
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
        ChangeStoreUsersPassword: defaultResolver(
            privateResolverForStoreUser(ChangeStoreUsersPasswordFunc)
        )
    }
};
export default resolvers;
