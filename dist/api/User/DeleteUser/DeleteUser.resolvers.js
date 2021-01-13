"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteUserFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
exports.DeleteUserFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { param } = args;
        const { userSub, expiresAt } = param;
        const user = await User_1.UserModel.findBySub(userSub);
        await user.deleteUser(session, expiresAt || undefined);
        await user.save({
            session
        });
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
        DeleteUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.DeleteUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=DeleteUser.resolvers.js.map