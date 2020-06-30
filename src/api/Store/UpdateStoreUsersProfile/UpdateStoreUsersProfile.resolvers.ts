import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    UpdateStoreUsersProfileResponse,
    UpdateStoreUsersProfileMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { StoreUserModel } from "../../../models/StoreUser";
import { ERROR_CODES } from "../../../types/values";
import { ApolloError } from "apollo-server";

export const UpdateStoreUsersProfileFunc = async ({
    args,
    context: { req }
}): Promise<UpdateStoreUsersProfileResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: storeUserDoc } = req;
        const {
            password,
            param: { name, timezone }
        } = args as UpdateStoreUsersProfileMutationArgs;

        const storeUser = await StoreUserModel.findById(storeUserDoc._id);
        if (!storeUser) {
            throw new ApolloError(
                "존재하지 않는 StoreUserId... 삭제된듯?",
                ERROR_CODES.ACCESS_DENY_USER
            );
        }

        const passwordCorrect = await storeUser.comparePassword(password);

        if (!passwordCorrect) {
            throw new ApolloError(
                "패스워드를 확인해주세요.",
                ERROR_CODES.PASSWORD_COMPARE_ERROR
            );
        }

        if (name) {
            storeUser.name = name;
        }
        if (timezone) {
            await storeUser.setZoneinfo(timezone);
        }

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
        UpdateStoreUsersProfile: defaultResolver(
            privateResolverForStoreUser(UpdateStoreUsersProfileFunc)
        )
    }
};
export default resolvers;
