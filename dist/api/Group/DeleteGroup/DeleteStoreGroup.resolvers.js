"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const StoreGroup_1 = require("../../../models/StoreGroup");
const resolvers = {
    Mutation: {
        DeleteStoreGroup: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { groupId } = param;
                const group = await StoreGroup_1.StoreGroupModel.findById(groupId);
                if (!group) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Group", values_1.ERROR_CODES.UNEXIST_GROUP);
                }
                if (!group.userId.equals(cognitoUser._id)) {
                    throw new apollo_server_1.ApolloError("Group 접근 권한이 없습니다.");
                }
                await StoreGroup_1.StoreGroupModel.deleteOne({
                    _id: group._id
                }, {
                    session
                });
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
//# sourceMappingURL=DeleteStoreGroup.resolvers.js.map