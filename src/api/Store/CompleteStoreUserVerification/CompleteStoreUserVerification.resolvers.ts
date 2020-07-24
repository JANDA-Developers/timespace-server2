import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CompleteStoreUserVerificationResponse,
    CompleteStoreUserVerificationMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreUserModel } from "../../../models/StoreUser/StoreUser";

export const CompleteStoreUserVerificationFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<CompleteStoreUserVerificationResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: storeUserDoc } = req;
        const storeUser = await StoreUserModel.findById(storeUserDoc._id);
        if (!storeUser) {
            throw new Error("존재하지 않는 StoreUserId");
        }
        const {
            code,
            target
        } = args as CompleteStoreUserVerificationMutationArgs;
        if (target === "PHONE" && storeUser.phoneVerificationCode !== code) {
            throw new ApolloError(
                "인증코드가 일치하지 않습니다.",
                ERROR_CODES.AUTHORIZATION_FAIL
            );
        } else {
            storeUser.verifiedPhoneNumber = true;
        }

        if (target === "EMAIL" && storeUser.emailVerificationCode !== code) {
            throw new ApolloError(
                "인증코드가 일치하지 않습니다.",
                ERROR_CODES.AUTHORIZATION_FAIL
            );
        } else {
            storeUser.verifiedEmail = true;
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
        CompleteStoreUserVerification: defaultResolver(
            privateResolverForStoreUser(CompleteStoreUserVerificationFunc)
        )
    }
};
export default resolvers;
