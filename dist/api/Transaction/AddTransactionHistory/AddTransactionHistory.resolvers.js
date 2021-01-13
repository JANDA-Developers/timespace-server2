"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTransactionHistoryFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
exports.AddTransactionHistoryFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        // const { cognitoUser } = req;
        const { transactionId, input } = args;
        console.log({
            transactionId,
            input
        });
        /**
         * ============================================================
         *
         * Your Code Here~!
         *
         * ============================================================
         */
        await session.commitTransaction();
        session.endSession();
        throw new apollo_server_1.ApolloError("개발중", values_1.ERROR_CODES.UNDERDEVELOPMENT);
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        AddTransactionHistory: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForInternalExec(exports.AddTransactionHistoryFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=AddTransactionHistory.resolvers.js.map