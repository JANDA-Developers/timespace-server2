import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CancelItemForBuyerResponse, CancelItemForBuyerInput } from "GraphType";
import {
    defaultResolver,
    privateResolverForBuyer
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";
import { UserModel } from "../../../models/User";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";

const resolvers: Resolvers = {
    Mutation: {
        CancelItemForBuyer: defaultResolver(
            privateResolverForBuyer(
                async ({
                    args,
                    context: { req }
                }): Promise<CancelItemForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoBuyer } = req;
                        const {
                            param
                        }: { param: CancelItemForBuyerInput } = args;
                        // TODO: 렛츠고 ㄱㄱ
                        const item = await ItemModel.findByCode(param.itemCode);
                        await item
                            .applyStatus("CANCELED", {
                                comment: param.comment || undefined,
                                workerId: new ObjectId(cognitoBuyer._id)
                            })
                            .save({ session });
                        await item.save({ session });

                        const product = await ProductModel.findById(
                            item.productId
                        );
                        if (!product) {
                            throw new ApolloError(
                                "존재하지 않는 Product",
                                ERROR_CODES.UNEXIST_PRODUCT
                            );
                        }
                        const seller = await UserModel.findById(product.userId);
                        if (!seller) {
                            throw new ApolloError(
                                "존재하지 않는 Seller",
                                ERROR_CODES.UNAUTHORIZED_USER
                            );
                        }

                        await session.commitTransaction();
                        session.endSession();
                        // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ
                        return {
                            ok: true,
                            error: null,
                            data: item as any
                        };
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};

export default resolvers;
