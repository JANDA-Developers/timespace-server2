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

const resolvers: Resolvers = {
    Mutation: {
        CancelItemForBuyer: defaultResolver(
            privateResolverForBuyer(
                async (
                    { parent, info, args, context: { req } },
                    stack
                ): Promise<CancelItemForBuyerResponse> => {
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
