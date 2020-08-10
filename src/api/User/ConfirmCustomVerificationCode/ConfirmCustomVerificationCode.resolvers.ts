import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    ConfirmCustomVerificationCodeResponse,
    ConfirmCustomVerificationCodeMutationArgs,
    UserRole
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { UserModel } from "../../../models/User";
import { BuyerModel } from "../../../models/Buyer";

export const ConfirmCustomVerificationCodeFunc = async (
    { args, context: { req } },
    stack: any[]
): Promise<ConfirmCustomVerificationCodeResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            code,
            email,
            role
        } = args as ConfirmCustomVerificationCodeMutationArgs;
        const { UserPoolId, Username } = await getUserInfo(email, code, role);
        const cognito = new CognitoIdentityServiceProvider();
        const result = await cognito
            .adminConfirmSignUp({
                UserPoolId,
                Username
            })
            .promise();

        console.log({ confirmResult: result });

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

const getUserInfo = async (
    email: string,
    code: string,
    role: UserRole
): Promise<{
    Username: string;
    UserPoolId: string;
}> => {
    if (role === "SELLER") {
        const seller = await UserModel.findOne({
            email
        }).exec();
        if (!seller) {
            throw new Error("가입된 ID가 없습니다.");
        }
        if (seller.confirmationCode !== code) {
            console.log(seller.confirmationCode);
            throw new Error("일치하지 않는 코드입니다.");
        }
        const UserPoolId = process.env.COGNITO_POOL_ID || "";
        return {
            UserPoolId,
            Username: seller.sub
        };
    } else {
        const buyer = await BuyerModel.findOne({
            email
        }).exec();
        if (!buyer) {
            throw new Error("가입된 ID가 없습니다.");
        }
        if (buyer.confirmationCode !== code) {
            console.log(buyer.confirmationCode);
            throw new Error("일치하지 않는 코드입니다.");
        }
        const UserPoolId = process.env.COGNITO_POOL_ID_BUYER || "";
        return {
            UserPoolId,
            Username: buyer.sub
        };
    }
};

const resolvers: Resolvers = {
    Mutation: {
        ConfirmCustomVerificationCode: defaultResolver(
            ConfirmCustomVerificationCodeFunc
        )
    }
};
export default resolvers;
