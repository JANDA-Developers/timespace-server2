import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { DeleteItemResponse, DeleteItemInput } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item";
import { StoreModel } from "../../../models/Store";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    Mutation: {
        DeleteItem: defaultResolver(
            privateResolver(
                async ({ args: { param } }): Promise<DeleteItemResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { itemCode } = param as DeleteItemInput;
                        const item = await ItemModel.findByCode(itemCode);
                        const itemId = new ObjectId(item._id);
                        const store = await StoreModel.findById(item.storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                "UNEXIST_STORE"
                            );
                        }

                        store.items = store.items.filter(
                            itm => !itemId.equals(itm)
                        );

                        await ItemModel.deleteOne(
                            {
                                _id: itemId
                            },
                            {
                                session
                            }
                        );
                        await store.save({ session });

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
