import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CompleteFindStoreUserEmailResponse,
    CompleteFindStoreUserEmailMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreGroupCls } from "../../../models/StoreGroup";
import { completeVerification } from "../../../models/Verification/verificationFunc";
import { StoreUserModel } from "../../../models/StoreUser/StoreUser";

export const CompleteFindStoreUserEmailFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<CompleteFindStoreUserEmailResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            storeGroup
        }: {
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const {
            phoneNumber,
            code
        } = args as CompleteFindStoreUserEmailMutationArgs;
        const verificationResult = await completeVerification(
            {
                payload: phoneNumber,
                target: "PHONE",
                storeGroupCode: storeGroup.code,
                code
            },
            session
        );
        if (!verificationResult) {
            throw new Error("인증에 실패하였습니다. 인증번호를 확인해주세요");
        }
        const storeUser = await StoreUserModel.findOne({
            $and: [
                {
                    $or: [
                        {
                            phoneNumber
                        },
                        {
                            phoneNumber: "+82" + phoneNumber
                        },
                        {
                            phoneNumber: "+82" + phoneNumber.substr(1)
                        }
                    ]
                },
                {
                    storeGroupCode: storeGroup.code
                }
            ]
        });
        if (!storeUser) {
            throw new ApolloError(
                "가입된 Email이 없습니다.",
                ERROR_CODES.UNEXIST_STORE_USER
            );
        }

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            email: storeUser.email
        };
    } catch (error) {
        const temp = await errorReturn(error, session);
        return {
            ...temp,
            email: null
        };
    }
};

const resolvers: Resolvers = {
    Mutation: {
        CompleteFindStoreUserEmail: defaultResolver(
            privateResolverForStoreGroup(CompleteFindStoreUserEmailFunc)
        )
    }
};
export default resolvers;
