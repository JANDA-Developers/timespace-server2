"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateGoogleUserFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const User_1 = require("../../../models/User");
const mongodb_1 = require("mongodb");
exports.ValidateGoogleUserFunc = async ({ args, context: { req } }) => {
    try {
        const { cognitoUser } = req;
        const data = {
            isInitiated: false
        };
        const user = await User_1.UserModel.findOne({
            sub: cognitoUser.sub
        });
        if (!user) {
            return {
                ok: true,
                error: null,
                data
            };
        }
        if (new mongodb_1.ObjectId(cognitoUser["custom:_id"]).equals(user._id)) {
            data.isInitiated = true;
        }
        console.log({
            cognitoUser,
            data
        });
        return {
            ok: true,
            error: null,
            data
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Query: {
        ValidateGoogleUser: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.ValidateGoogleUserFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=ValidateGoogleUser.resolvers.js.map