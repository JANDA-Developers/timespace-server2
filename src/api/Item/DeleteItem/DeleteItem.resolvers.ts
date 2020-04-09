import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { DeleteItemResponse, DeleteItemInput } from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item/Item";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { ONE_DAY } from "../../../utils/dateFuncs";

const resolvers: Resolvers = {
    Mutation: {
        DeleteItem: defaultResolver(
            async ({
                args: { param },
                context: { req }
            }): Promise<DeleteItemResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const { itemId } = param as DeleteItemInput;
                    const item = await ItemModel.findById(itemId);
                    if (!item) {
                        throw new ApolloError(
                            "존재하지 않는 Item입니다",
                            ERROR_CODES.UNEXIST_ITEM
                        );
                    }
                    item.expiresAt = new Date(
                        new Date().getTime() + ONE_DAY * 3
                    );
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
    }
};
export default resolvers;
