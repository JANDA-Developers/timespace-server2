"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitSmsFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
const apollo_server_1 = require("apollo-server");
const graphql_1 = require("graphql");
const requestSmsApi_1 = require("../../../utils/requestSmsApi");
exports.InitSmsFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const user = await User_1.UserModel.findUser(cognitoUser);
        const queryResult = await requestSmsApi_1.requestApi(process.env.SMS_API_EDGE || "", graphql_1.print(apollo_server_1.gql `
                mutation {
                    Init {
                        ok
                        errors
                        data {
                            key
                        }
                    }
                }
            `));
        const smsKey = queryResult.Init.data.key;
        user.smsKey = smsKey;
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: user.smsKey || null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        InitSms: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.InitSmsFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=InitSms.resolvers.js.map