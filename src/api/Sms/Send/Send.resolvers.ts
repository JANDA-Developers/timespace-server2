import { ApolloError, gql } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { SendResponse, SendInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { UserModel } from "../../../models/User";
import { requestApi } from "../../../utils/requestSmsApi";
import { print } from "graphql";
import { ItemModel } from "../../../models/Item/Item";
import { getReplacementSetsForItem } from "../../../models/Item/ItemSmsFunctions";

export const SendFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<SendResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const {
            param: { message, itemIds, receivers, senderId }
        }: { param: SendInput } = args;

        const user = await UserModel.findUser(cognitoUser);
        const smsKey = user.smsKey;
        // 결제 과정이 빠졌다..
        if (!smsKey) {
            throw new ApolloError(
                "SmsKey가 존재하지 않습니다. 사용신청을 해주세요.",
                ERROR_CODES.UNEXIST_SMS_KEY
            );
        }
        if (!receivers && !itemIds) {
            throw new ApolloError(
                "Both parameters are null => itemIds, receivers",
                ERROR_CODES.INVALID_PARAMETERS
            );
        }
        // Send 로직 ㄱㄱ
        const sendTargets =
            (itemIds &&
                (await Promise.all(
                    itemIds.map(async itemId => {
                        const item = await ItemModel.findById(itemId);
                        if (!item) {
                            throw new ApolloError(
                                "존재하지 않는 ItemId",
                                ERROR_CODES.UNEXIST_ITEM
                            );
                        }
                        const replacementSets = await getReplacementSetsForItem(
                            item
                        );
                        return {
                            receiver: item.phoneNumber,
                            replacementSets
                        };
                    })
                ))) ||
            receivers.map(r => ({ receiver: r }));
        const variables = {
            input: {
                sendTargets,
                message,
                senderId
            }
        };
        const queryResult = await requestApi(
            process.env.SMS_API_EDGE || "",
            print(gql`
                mutation Send($input: SendInput!) {
                    Send(input: $input) {
                        ok
                        errors
                        data {
                            _id
                            ok
                            successCount
                            errorCount
                            amount
                            type
                            aligoMid
                        }
                    }
                }
            `),
            variables,
            {
                smsKey
            }
        );

        await session.commitTransaction();
        session.endSession();
        console.info(queryResult.Send.data);
        return {
            ok: true,
            error: null,
            data: queryResult.Send.data
        };
    } catch (error) {
        const response = await errorReturn(error, session);
        return {
            ...response,
            data: []
        };
    }
};

const resolvers: Resolvers = {
    Mutation: {
        Send: defaultResolver(privateResolver(SendFunc))
    }
};
export default resolvers;
