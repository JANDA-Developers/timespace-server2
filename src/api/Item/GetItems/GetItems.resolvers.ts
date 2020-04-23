import { ApolloError } from "apollo-server";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetItemsResponse, GetItemsInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreModel } from "../../../models/Store/Store";
import { ItemModel, ItemCls } from "../../../models/Item/Item";
import { makeFilterQuery } from "./itemFilter";
import { GetItemsSortInput } from "GraphType";
import { DocumentType } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    Query: {
        GetItems: defaultResolver(
            privateResolver(
                async (
                    { parent, info, args, context: { req } },
                    stack
                ): Promise<GetItemsResponse> => {
                    try {
                        const { cognitoUser } = req;
                        const user = await UserModel.findUser(cognitoUser);
                        const { param }: { param: GetItemsInput } = args;
                        const storeIds = param.storeId
                            ? [new ObjectId(param.storeId)]
                            : user.stores;

                        const store = await StoreModel.findById(storeIds[0]);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 StoreId",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }
                        if (!store.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "접근 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE
                            );
                        }
                        const sortQuery = param.sort;
                        const query = makeFilterQuery(
                            param.filter,
                            store.periodOption.offset
                        );
                        const itemsPromise = () => {
                            const func = ItemModel.find({
                                storeId: { $in: storeIds },
                                ...query,
                                expiresAt: { $exists: false }
                            });

                            return (sortInput: GetItemsSortInput) => {
                                return func.sort({
                                    [sortInput.sortKey]: sortInput.sort
                                });
                            };
                        };
                        const itemsGetFunc = itemsPromise();
                        const result: DocumentType<ItemCls>[] = [];
                        if (sortQuery && sortQuery.length !== 0) {
                            let r: any;
                            for (const s of sortQuery) {
                                r = itemsGetFunc(s);
                            }
                            result.push(...(await r.exec()));
                        } else {
                            result.push(
                                ...(await itemsGetFunc({
                                    sortKey: "dateTimeRange.from",
                                    sort: -1
                                }).exec())
                            );
                        }

                        // const items = await ItemModel.find({
                        //     storeId: store._id,
                        //     ...query,
                        //     expiresAt: { $exists: false }
                        // }).sort({ "dateTimeRange.from": -1 });

                        return {
                            ok: true,
                            error: null,
                            data: result as any
                        };
                    } catch (error) {
                        const result = await errorReturn(error);
                        return {
                            ...result,
                            data: []
                        };
                    }
                }
            )
        )
    }
};

export default resolvers;
