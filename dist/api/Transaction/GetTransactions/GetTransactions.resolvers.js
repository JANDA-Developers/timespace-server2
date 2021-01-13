"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionsFunc = void 0;
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Transaction_1 = require("../../../models/Transaction/Transaction");
const mongodb_1 = require("mongodb");
const User_1 = require("../../../models/User");
exports.GetTransactionsFunc = async ({ parent, info, args, context: { req } }, stack) => {
    try {
        const { cognitoUser } = req;
        const user = await User_1.UserModel.findBySub(cognitoUser.sub);
        user.stores;
        const { filter, pagingInput } = args;
        const { index, rowCount } = pagingInput;
        const query = makeQuery(filter);
        const transactions = await Transaction_1.TransactionModel.find(query)
            .skip(pagingInput.index * pagingInput.rowCount)
            .limit(pagingInput.rowCount)
            .exec();
        const total = await Transaction_1.TransactionModel.find(query).countDocuments();
        return {
            ok: true,
            error: null,
            data: {
                pageInfo: {
                    currentPageIndex: index,
                    currentRowCount: rowCount,
                    totalPageCount: Math.floor(total / rowCount),
                    totalRowCount: total
                },
                data: transactions
            }
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const makeQuery = ({ createdAtRange, 
// 지원하려면 결국 aggregate 해야할듯
usageDateTimeRange, productIds, storeIds }) => {
    // scope 문제... productIds가 있으면 storeIds는 무시된다.
    const query = { $and: [] };
    if (createdAtRange) {
        const { from, to } = createdAtRange;
        query.$and.push({
            createdAt: {
                $gte: new Date(from),
                $lte: new Date(to)
            }
        });
    }
    if (storeIds) {
        const storeObjectIds = storeIds.map(id => new mongodb_1.ObjectId(id));
        query.$and.push({
            storeId: {
                $in: storeObjectIds
            }
        });
    }
};
const resolvers = {
    Query: {
        GetTransactions: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(exports.GetTransactionsFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=GetTransactions.resolvers.js.map