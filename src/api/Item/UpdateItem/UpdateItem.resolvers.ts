import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { UpdateItemResponse, UpdateItemInput } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ItemModel } from "../../../models/Item";

const resolvers: Resolvers = {
    Mutation: {
        UpdateItem: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<UpdateItemResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const {
                            itemCode,
                            updateItemParamInput
                        } = param as UpdateItemInput;
                        const item = await ItemModel.findByCode(itemCode);

                        for (const fieldName in updateItemParamInput) {
                            const element = updateItemParamInput[fieldName];
                            if (element) {
                                item[fieldName] = element;
                            }
                        }
                        await item.save({
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
