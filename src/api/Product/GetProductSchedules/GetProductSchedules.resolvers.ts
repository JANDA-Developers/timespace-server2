import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetProductSchedulesResponse,
    GetProductSchedulesInput
} from "GraphType";
import {
    defaultResolver,
    privateResolverForBuyer
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreModel } from "../../../models/Store/Store";

export const GetProductSchedulesFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetProductSchedulesResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoBuyer } = req;
        const { param }: { param: GetProductSchedulesInput } = args;
        const store = await StoreModel.findById(param.storeId);
        console.log({
            cognitoBuyer,
            store,
            param
        });
        await session.commitTransaction();
        session.endSession();
        throw new ApolloError("개발중", ERROR_CODES.UNDERDEVELOPMENT);
    } catch (error) {
        const result = await errorReturn(error, session);
        return {
            ...result,
            data: []
        };
    }
};

const resolvers: Resolvers = {
    Query: {
        GetProductSchedules: defaultResolver(
            privateResolverForBuyer(GetProductSchedulesFunc)
        )
    }
};
export default resolvers;
