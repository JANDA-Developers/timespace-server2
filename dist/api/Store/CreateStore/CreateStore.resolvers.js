"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const CreateStoreFunc_1 = require("./CreateStoreFunc");
const resolvers = {
    Mutation: {
        CreateStore: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(CreateStoreFunc_1.createStoreFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CreateStore.resolvers.js.map