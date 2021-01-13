"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindMyEmailFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
exports.FindMyEmailFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { param } = args;
        /**
         * ============================================================
         *
         * Your Code Here~!
         *
         * ============================================================
         */
        console.log({ param });
        await session.commitTransaction();
        session.endSession();
        throw new apollo_server_1.ApolloError("개발중", values_1.ERROR_CODES.UNDERDEVELOPMENT);
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Query: {
        FindMyEmail: resolverFuncWrapper_1.defaultResolver(exports.FindMyEmailFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=FindMyEmail.resolvers.js.map