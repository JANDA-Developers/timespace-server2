import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateItemForBuyerResponse, CreateItemForBuyerInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item/Item";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel } from "../../../models/Product/Product";
import { ObjectId } from "mongodb";
import { offsetDate, ONE_MINUTE } from "../../../utils/dateFuncs";

const resolvers: Resolvers = {
    Mutation: {
        CreateItemForBuyer: defaultResolver(
            privateResolver(
                async ({
                    args,
                    context: { req }
                }): Promise<CreateItemForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const {
                            param
                        }: { param: CreateItemForBuyerInput } = args;
                        // TODO: cognitoUser로부터 Buyer 권한이 있는지 확인 ㄱㄱ
                        console.log(cognitoUser);
                        if (cognitoUser["custom:isBuyer"] !== "1") {
                            throw new ApolloError(
                                "상품 구매 권한이 없습니다. 먼저 Buyer 인증을 해주세요.",
                                ERROR_CODES.ACCESS_DENY_ITEM
                            );
                        }
                        const now = new Date();
                        const product = await ProductModel.findByCode(
                            param.productCode
                        );
                        const item = new ItemModel();
                        if (param.dateTimeRange) {
                            const { from, to } = param.dateTimeRange;
                            offsetDate(from, product.periodOption.offset);
                            offsetDate(to, product.periodOption.offset);
                            item.dateTimeRange = {
                                from,
                                to,
                                interval: Math.floor(
                                    (to.getTime() - from.getTime()) / ONE_MINUTE
                                )
                            };
                        }
                        for (const fieldName in param) {
                            const element = param[fieldName];
                            item[fieldName] = element;
                        }
                        item.productId = product._id;
                        item.storeId = product.storeId;
                        item.buyerId = new ObjectId(cognitoUser._id);
                        await item.setCode(product.code, now);

                        // validation 필요함!
                        // needConfirm
                        // const businessHours = product.businessHours;
                        // const dateTimeRange = param.dateTimeRange;

                        // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ

                        await item.save({ session });
                        await session.commitTransaction();
                        session.endSession();
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
