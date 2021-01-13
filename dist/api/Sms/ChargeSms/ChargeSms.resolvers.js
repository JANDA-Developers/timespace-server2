"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargeSmsFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const User_1 = require("../../../models/User");
const requestSmsApi_1 = require("../../../utils/requestSmsApi");
const graphql_1 = require("graphql");
exports.ChargeSmsFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { amount } = args;
        const user = await User_1.UserModel.findUser(cognitoUser);
        const smsKey = user.smsKey;
        // 결제 과정이 빠졌다..
        if (!smsKey) {
            throw new apollo_server_1.ApolloError("SmsKey가 존재하지 않습니다. 사용신청을 해주세요.", values_1.ERROR_CODES.UNEXIST_SMS_KEY);
        }
        const queryResult = await requestSmsApi_1.requestApi(process.env.SMS_API_EDGE || "", graphql_1.print(apollo_server_1.gql `
                mutation {
                    ChargePoint(amount: ${amount}) {
                        ok
                        errors
                        data {
                            amount
                        }
                    }
                }
            `), undefined, {
            smsKey
        });
        const result = queryResult.ChargePoint;
        if (!result.ok) {
            throw new apollo_server_1.ApolloError("통신 에러", "UNDEFINED_ERROR");
        }
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        ChargeSms: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.ChargeSmsFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=ChargeSms.resolvers.js.map