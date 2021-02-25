import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    StartStoreUserVerificationResponse,
    StartStoreUserVerificationMutationArgs
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { startStoreUserVerification } from "../../../models/StoreUser/storeUserFunc";
import { StoreUserModel } from "../../../models/StoreUser/StoreUser";
import { sendEmail } from "../../../utils/sesFunctions";

export const StartStoreUserVerificationFunc = async ({
    args,
    context: { req }
}): Promise<StartStoreUserVerificationResponse> => {
    console.log("!!!!!!!!!");
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: stDoc } = req;
        const storeUser = await StoreUserModel.findById(stDoc._id);
        if (!storeUser) {
            throw new Error("존재하지 않는 StoreUserId");
        }
        const { target } = args as StartStoreUserVerificationMutationArgs;
        const verificationCode = await startStoreUserVerification(
            storeUser,
            target,
            session
        );

        console.log({
            type: "전화번호 인증",
            code: verificationCode,
            user: storeUser._id
        });
        console.log("이메일 전송!");
        const result = await sendEmail({html : "<div>인증번호 : " + verificationCode+"</div>", summary : "인증번호 : " + verificationCode, targets: [storeUser.email]});
        console.log(result);
        await session.commitTransaction();
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        console.log("StartStoreUserVerificationFunc error!!!")
        console.log(error)
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        StartStoreUserVerification: defaultResolver(
            privateResolverForStoreUser(StartStoreUserVerificationFunc)
        )
    }
};
export default resolvers;
