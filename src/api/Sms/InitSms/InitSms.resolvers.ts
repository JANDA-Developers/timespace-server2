import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { InitSmsResponse } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import { gql, ApolloError } from "apollo-server";
import { print } from "graphql";
import Axios from "axios";
import { mLogger } from "../../../logger";

export const InitSmsFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<InitSmsResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const user = await UserModel.findUser(cognitoUser);

        const query = print(gql`
            mutation {
                Init {
                    ok
                    errors
                    data {
                        key
                    }
                }
            }
        `);
        const queryResult = await Axios.post(
            process.env.SMS_API_EDGE || "",
            {
                query
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (queryResult.status !== 200) {
            throw new ApolloError(
                "Axios 통신 실패",
                "REQUEST_FAIL",
                queryResult.data
            );
        }
        const result = JSON.stringify(queryResult.data);
        mLogger.warn(result);

        const smsKey = queryResult.data.data.Init.data.key;
        user.smsKey = smsKey;
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: user.smsKey || null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        InitSms: defaultResolver(privateResolver(InitSmsFunc))
    }
};
export default resolvers;
