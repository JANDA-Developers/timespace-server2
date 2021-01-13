"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundItemFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const ItemModelFunctions_1 = require("../../../models/Item/ItemModelFunctions");
const CancelItemTransaction_1 = require("../shared/CancelItemTransaction");
exports.RefundItemFunc = async ({ args }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { itemId, refundInput } = args;
        const item = await ItemModelFunctions_1.findItem(itemId);
        await CancelItemTransaction_1.cancelTransaction(item, refundInput, session);
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
        RefundItem: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.RefundItemFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=RefundItem.resolvers.js.map