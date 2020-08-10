import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    StartFindStoreUserEmailResponse,
    StartFindStoreUserEmailMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { startVerification } from "../../../models/Verification/verificationFunc";
import { StoreGroupCls } from "../../../models/StoreGroup";

export const StartFindStoreUserEmailFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<StartFindStoreUserEmailResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            storeGroup
        }: {
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const { phoneNumber } = args as StartFindStoreUserEmailMutationArgs;
        const verification = await startVerification(
            "PHONE",
            phoneNumber,
            storeGroup.code,
            session
        );

        console.log({
            verification
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
        StartFindStoreUserEmail: defaultResolver(
            privateResolverForStoreGroup(StartFindStoreUserEmailFunc)
        )
    }
};
export default resolvers;
