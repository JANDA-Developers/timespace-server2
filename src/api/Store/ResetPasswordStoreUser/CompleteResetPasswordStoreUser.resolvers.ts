import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CompleteResetPasswordStoreUserResponse,
    CompleteResetPasswordStoreUserMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { completeVerification } from "../../../models/Verification/verificationFunc";
import { StoreGroupCls } from "../../../models/StoreGroup";
import { StoreUserModel } from "../../../models/StoreUser/StoreUser";

export const CompleteResetPasswordStoreUserFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<CompleteResetPasswordStoreUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            storeGroup
        }: {
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const {
            code,
            newPassword,
            payload,
            target
        } = args as CompleteResetPasswordStoreUserMutationArgs;
        const verification = await completeVerification({
            target,
            payload,
            code,
            storeGroupCode: storeGroup.code
        });
        if (!verification) {
            throw new Error("인증 실패");
        }
        const storeUser = await StoreUserModel.findOne({
            passwordChangeVerificationId: verification?._id
        });
        if (!storeUser) {
            throw new Error("존재하지 않는 StoreUser");
        }
        storeUser.password = newPassword;
        await storeUser.hashPassword();
        await storeUser.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            storeUser: storeUser as any
        };
    } catch (error) {
        const temp = await errorReturn(error, session);
        return {
            ...temp,
            storeUser: null
        };
    }
};

const resolvers: Resolvers = {
    Mutation: {
        CompleteResetPasswordStoreUser: defaultResolver(
            privateResolverForStoreGroup(CompleteResetPasswordStoreUserFunc)
        )
    }
};
export default resolvers;
