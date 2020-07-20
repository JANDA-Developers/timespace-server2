import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetTransactionsResponse,
    GetTransactionsQueryArgs,
    GetTransactionsFilterInput
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { TransactionModel } from "../../../models/Transaction/Transaction";
import { ObjectId } from "mongodb";
import { UserModel } from "../../../models/User";

export const GetTransactionsFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetTransactionsResponse> => {
    try {
        const { cognitoUser } = req;
        const user = await UserModel.findBySub(cognitoUser.sub);
        user.stores;
        const { filter, pagingInput } = args as GetTransactionsQueryArgs;
        const { index, rowCount } = pagingInput;
        const query = makeQuery(filter);
        const transactions = await TransactionModel.find(query)
            .skip(pagingInput.index * pagingInput.rowCount)
            .limit(pagingInput.rowCount)
            .exec();
        const total = await TransactionModel.find(query).countDocuments();
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
                data: transactions as any
            }
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const makeQuery = ({
    createdAtRange,
    // 지원하려면 결국 aggregate 해야할듯
    usageDateTimeRange,
    productIds,
    storeIds
}: GetTransactionsFilterInput): any => {
    // scope 문제... productIds가 있으면 storeIds는 무시된다.
    const query = { $and: [] as any[] };
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
        const storeObjectIds = storeIds.map(id => new ObjectId(id));
        query.$and.push({
            storeId: {
                $in: storeObjectIds
            }
        });
    }
};

const resolvers: Resolvers = {
    Query: {
        GetTransactions: defaultResolver(privateResolver(GetTransactionsFunc))
    }
};

export default resolvers;
