import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetProductsForBuyerResponse,
    GetProductsForBuyerInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { ProductModel } from "../../../models/Product";

const resolvers: Resolvers = {
    Query: {
        GetProductsForBuyer: defaultResolver(
            async ({
                args: { param }
            }): Promise<GetProductsForBuyerResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const { storeCode } = param as GetProductsForBuyerInput;
                    const store = await StoreModel.findByCode(storeCode);
                    const products = await ProductModel.find({
                        _id: {
                            $in: store.products
                        },
                        expiresAt: {
                            $exists: false
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
    }
};
export default resolvers;
