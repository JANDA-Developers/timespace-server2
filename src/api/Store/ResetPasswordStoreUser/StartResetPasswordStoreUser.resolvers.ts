import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    StartResetPasswordStoreUserResponse,
    StartResetPasswordStoreUserMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { StoreGroupCls } from "../../../models/StoreGroup";
import { startVerification } from "../../../models/Verification/verificationFunc";
import { StoreUserModel } from "../../../models/StoreUser/StoreUser";

export const StartResetPasswordStoreUserFunc = async ({
    args,
    context: { req }
}): Promise<StartResetPasswordStoreUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            storeGroup
        }: {
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const {
            email,
            target,
            payload
        } = args as StartResetPasswordStoreUserMutationArgs;
        const storeUser = await StoreUserModel.findOne({
            email,
            phoneNumber: new RegExp(payload, "gi")
        });
        if (!storeUser) {
            throw new Error(
                "가입된 ID가 존재하지 않습니다. 회원가입을 먼저 시도해 주세요."
            );
        }
        const verification = await startVerification(
            target,
            payload,
            storeGroup.code,
            session
        );
        storeUser.passwordChangeVerificationId = verification._id;
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
        StartResetPasswordStoreUser: defaultResolver(
            privateResolverForStoreGroup(StartResetPasswordStoreUserFunc)
        )
    }
};
export default resolvers;
