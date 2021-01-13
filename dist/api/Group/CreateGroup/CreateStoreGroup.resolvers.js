"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const mongodb_1 = require("mongodb");
const StoreGroup_1 = require("../../../models/StoreGroup");
const resolvers = {
    Mutation: {
        CreateStoreGroup: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const group = new StoreGroup_1.StoreGroupModel({
                    ...param,
                    userId: new mongodb_1.ObjectId(cognitoUser._id)
                });
                await group.save({ session });
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null,
                    data: group
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CreateStoreGroup.resolvers.js.map