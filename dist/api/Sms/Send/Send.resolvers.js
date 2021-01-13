"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const User_1 = require("../../../models/User");
const requestSmsApi_1 = require("../../../utils/requestSmsApi");
const graphql_1 = require("graphql");
const Item_1 = require("../../../models/Item/Item");
const ItemSmsFunctions_1 = require("../../../models/Item/ItemSmsFunctions");
exports.SendFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { param: { message, itemIds, receivers, senderId } } = args;
        const user = await User_1.UserModel.findUser(cognitoUser);
        const smsKey = user.smsKey;
        // 결제 과정이 빠졌다..
        if (!smsKey) {
            throw new apollo_server_1.ApolloError("SmsKey가 존재하지 않습니다. 사용신청을 해주세요.", values_1.ERROR_CODES.UNEXIST_SMS_KEY);
        }
        if (!receivers && !itemIds) {
            throw new apollo_server_1.ApolloError("Both parameters are null => itemIds, receivers", values_1.ERROR_CODES.INVALID_PARAMETERS);
        }
        // Send 로직 ㄱㄱ
        const sendTargets = (itemIds &&
            (await Promise.all(itemIds.map(async (itemId) => {
                const item = await Item_1.ItemModel.findById(itemId);
                if (!item) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 ItemId", values_1.ERROR_CODES.UNEXIST_ITEM);
                }
                const replacementSets = await ItemSmsFunctions_1.getReplacementSetsForItem(item);
                return {
                    receiver: item.phoneNumber,
                    replacementSets
                };
            })))) ||
            receivers.map(r => ({ receiver: r }));
        const variables = {
            input: {
                sendTargets,
                message,
                senderId
            }
        };
        const queryResult = await requestSmsApi_1.requestApi(process.env.SMS_API_EDGE || "", graphql_1.print(apollo_server_1.gql `
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
            `), variables, {
            smsKey
        });
        await session.commitTransaction();
        session.endSession();
        console.info(queryResult.Send.data);
        return {
            ok: true,
            error: null,
            data: queryResult.Send.data
        };
    }
    catch (error) {
        const response = await utils_1.errorReturn(error, session);
        return {
            ...response,
            data: []
        };
    }
};
const resolvers = {
    Mutation: {
        Send: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.SendFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=Send.resolvers.js.map