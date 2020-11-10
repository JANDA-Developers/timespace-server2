import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { UpdateItemResponse, UpdateItemMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { findItem } from "../../../models/Item/ItemModelFunctions";

export const UpdateItemFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<UpdateItemResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { itemId, input } = args as UpdateItemMutationArgs;
        const item = await findItem(itemId);
        if (!item.userId.equals(cognitoUser._id)) {
            throw new ApolloError(
                "접근권한이 없습니다.",
                ERROR_CODES.ACCESS_DENY_ITEM
            );
        }
        if (input.name) {
            item.name = input.name;
        }

        if (input.phoneNumber) {
            item.phoneNumber = input.phoneNumber;
        }

        await item.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        UpdateItem: defaultResolver(privateResolver(UpdateItemFunc))
    }
};
export default resolvers;
