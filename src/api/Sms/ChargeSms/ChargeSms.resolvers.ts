import { ApolloError, gql } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { ChargeSmsResponse, ChargeSmsMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { UserModel } from "../../../models/User";
import { requestApi } from "../../../utils/requestSmsApi";
import { print } from "graphql";

export const ChargeSmsFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<ChargeSmsResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { amount }: ChargeSmsMutationArgs = args;

        const user = await UserModel.findUser(cognitoUser);
        const smsKey = user.smsKey;
        // 결제 과정이 빠졌다..
        if (!smsKey) {
            throw new ApolloError(
                "SmsKey가 존재하지 않습니다. 사용신청을 해주세요.",
                ERROR_CODES.UNEXIST_SMS_KEY
            );
        }

        const queryResult = await requestApi(
            process.env.SMS_API_EDGE || "",
            print(gql`
                mutation {
                    ChargePoint(amount: ${amount}) {
                        ok
                        errors
                        data {
                            amount
                        }
                    }
                }
            `),
            undefined,
            {
                smsKey
            }
        );

        const result = queryResult.ChargePoint;

        if (!result.ok) {
            throw new ApolloError("통신 에러", "UNDEFINED_ERROR");
        }

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
        ChargeSms: defaultResolver(privateResolver(ChargeSmsFunc))
    }
};
export default resolvers;
