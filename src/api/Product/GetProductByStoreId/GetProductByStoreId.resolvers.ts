import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetProductsByStoreIdResponse,
    GetProductsByStoreIdInput
} from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { ProductModel } from "../../../models/Product";
import { ERROR_CODES } from "../../../types/values";

const resolvers: Resolvers = {
    Query: {
        GetProductsByStoreId: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<GetProductsByStoreIdResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { storeId } = param as GetProductsByStoreIdInput;
                        const store = await StoreModel.findById(storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }
                        if (!store.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "조회 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE
                            );
                        }
                        const products = await ProductModel.find({
                            _id: {
                                $in: store.products
                            }
                        });
                        return {
                            ok: true,
                            error: null,
                            data: products as any
                        };
                    } catch (error) {
                        const result = await errorReturn(error, session);
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
