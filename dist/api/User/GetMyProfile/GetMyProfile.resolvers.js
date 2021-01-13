"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMyProfileFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
exports.GetMyProfileFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const { cognitoUser } = req;
    try {
        const user = await User_1.UserModel.findUser(cognitoUser);
        return {
            ok: true,
            error: null,
            data: {
                user: user
            }
        };
    }
    catch (error) {
        stack.push({
            cognitoUser
        });
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Query: {
        GetMyProfile: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.GetMyProfileFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetMyProfile.resolvers.js.map