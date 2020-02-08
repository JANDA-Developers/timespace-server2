import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateItemResponse, CreateItemInput } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item";
import { ObjectId } from "mongodb";
import { StoreModel } from "../../../models/Store";
import { ApolloError } from "apollo-server";

const resolvers: Resolvers = {
    Mutation: {
        CreateItem: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<CreateItemResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const {
                            descriptions,
                            images,
                            name,
                            storeId,
                            optionalParams
                        } = param as CreateItemInput;

                        const itemId = new ObjectId();
                        const store = await StoreModel.findById(storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                "UNEXIST_STORE"
                            );
                        }
                        store.items.push(itemId);

                        const item = new ItemModel({
                            _id: itemId,
                            name,
                            images,
                            storeId: new ObjectId(storeId),
                            descriptions,
                            usingPeriodOption: store.usingPeriodOption || false,
                            usingCapacityOption:
                                store.usingCapacityOption || false
                        });
                        if (optionalParams) {
                            for (const fieldName in optionalParams) {
                                const param = optionalParams[fieldName];
                                if (param) {
                                    item[fieldName] = param;
                                }
                            }
                        }
                        await item.save({ session });
                        await store.save({
                            session
                        });
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
