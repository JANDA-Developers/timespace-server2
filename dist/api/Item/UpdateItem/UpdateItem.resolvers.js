"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateItemFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const ItemModelFunctions_1 = require("../../../models/Item/ItemModelFunctions");
exports.UpdateItemFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { itemId, input } = args;
        const item = await ItemModelFunctions_1.findItem(itemId);
        if (!item.userId.equals(cognitoUser._id)) {
            throw new apollo_server_1.ApolloError("접근권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_ITEM);
        }
        if (input.name) {
            item.name = input.name;
        }
        if (input.phoneNumber) {
            item.phoneNumber = input.phoneNumber;
        }
        await item.save({ session });
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
        UpdateItem: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.UpdateItemFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=UpdateItem.resolvers.js.map