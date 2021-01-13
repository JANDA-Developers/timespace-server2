"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Item_1 = require("../../../models/Item/Item");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const dateFuncs_1 = require("../../../utils/dateFuncs");
const resolvers = {
    Mutation: {
        DeleteItem: resolverFuncWrapper_1.defaultResolver(async ({ args: { param }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { itemId } = param;
                const item = await Item_1.ItemModel.findById(itemId);
                if (!item) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Item입니다", values_1.ERROR_CODES.UNEXIST_ITEM);
                }
                item.expiresAt = new Date(new Date().getTime() + dateFuncs_1.ONE_DAY * 3);
                await item.save({ session });
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null,
                    data: item
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        })
    }
};
exports.default = resolvers;
//# sourceMappingURL=DeleteItem.resolvers.js.map