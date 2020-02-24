import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { PermitItemResponse, PermitItemInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { ItemModel } from "../../../models/Item/Item";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    Mutation: {
        PermitItem: defaultResolver(
            privateResolver(
                async ({
                    args,
                    context: { req }
                }): Promise<PermitItemResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const { param }: { param: PermitItemInput } = args;
                        const item = await ItemModel.findById(param.itemId);
                        if (!item) {
                            throw new ApolloError(
                                "존재하지 않는 ItemId",
                                ERROR_CODES.UNEXIST_ITEM,
                                {
                                    loc: "PermitItem",
                                    param,
                                    user: cognitoUser,
                                    item
                                }
                            );
                        }

                        await item
                            .applyStatus("PERMITTED", {
                                workerId: new ObjectId(cognitoUser._id),
                                comment: param.comment || undefined
                            })
                            .save({
                                session
                            });
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
