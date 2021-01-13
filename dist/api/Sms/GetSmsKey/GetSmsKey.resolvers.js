"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSmsKeyFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
exports.GetSmsKeyFunc = async ({ context: { req } }) => {
    try {
        const { cognitoUser } = req;
        return {
            ok: true,
            error: null,
            data: cognitoUser.smsKey
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const resolvers = {
    Query: {
        GetSmsKey: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.GetSmsKeyFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetSmsKey.resolvers.js.map