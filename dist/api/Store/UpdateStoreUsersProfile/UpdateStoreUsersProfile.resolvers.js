"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStoreUsersProfileFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
const values_1 = require("../../../types/values");
const apollo_server_1 = require("apollo-server");
exports.UpdateStoreUsersProfileFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: storeUserDoc } = req;
        const { password, param: { name, timezone } } = args;
        const storeUser = await StoreUser_1.StoreUserModel.findById(storeUserDoc._id);
        if (!storeUser) {
            throw new apollo_server_1.ApolloError("존재하지 않는 StoreUserId... 삭제된듯?", values_1.ERROR_CODES.ACCESS_DENY_USER);
        }
        const passwordCorrect = await storeUser.comparePassword(password);
        if (!passwordCorrect) {
            throw new apollo_server_1.ApolloError("패스워드를 확인해주세요.", values_1.ERROR_CODES.PASSWORD_COMPARE_ERROR);
        }
        if (name) {
            storeUser.name = name;
        }
        if (timezone) {
            await storeUser.setZoneinfo(timezone);
        }
        await storeUser.save({ session });
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
        UpdateStoreUsersProfile: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.UpdateStoreUsersProfileFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=UpdateStoreUsersProfile.resolvers.js.map