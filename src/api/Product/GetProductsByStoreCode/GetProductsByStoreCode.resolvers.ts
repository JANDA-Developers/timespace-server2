import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetProductsByStoreCodeResponse,
    GetProductsByStoreCodeInput
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
        GetProductsByStoreCode: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<GetProductsByStoreCodeResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const {
                            storeCode
                        } = param as GetProductsByStoreCodeInput;
                        const store = await StoreModel.findByCode(storeCode);
                        if (!store.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "조회 권한이 없습니다.",
                                ERROR_CODES.STORE_ACCESS_DENY
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
