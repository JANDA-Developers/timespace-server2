"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordStoreUserFunc = void 0;
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
exports.ChangePasswordStoreUserFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser: userDoc } = req;
        const { oldPassword, newPassword } = args;
        const storeUser = await StoreUser_1.StoreUserModel.findById(userDoc._id);
        if (!storeUser) {
            throw new Error("존재하지 않는 storeUser");
        }
        const correctPassword = storeUser.comparePassword(oldPassword);
        if (!correctPassword) {
            throw new apollo_server_1.ApolloError("패스워드를 확인해주세요.", values_1.ERROR_CODES.PASSWORD_COMPARE_ERROR);
        }
        storeUser.password = newPassword;
        await storeUser.hashPassword();
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
        ChangePasswordStoreUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreUser(exports.ChangePasswordStoreUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=ChangePasswordStoreUser.resolvers.js.map