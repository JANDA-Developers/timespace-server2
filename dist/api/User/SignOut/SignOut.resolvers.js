"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignOutFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
exports.SignOutFunc = async ({ parent, info, args, context: { req, res } }, stack) => {
    try {
        // const { cognitoUser } = req;
        const { role } = args;
        if (role === "SELLER") {
            req.session.seller = {};
        }
        else if (role === "BUYER") {
            req.session.buyer = {};
        }
        req.session.save(err => {
            if (err) {
                throw new err();
            }
        });
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Mutation: {
        SignOut: resolverFuncWrapper_1.defaultResolver(exports.SignOutFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=SignOut.resolvers.js.map