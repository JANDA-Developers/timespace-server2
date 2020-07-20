import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetPrivacyPolicyResponse, GetPrivacyPolicyQueryArgs } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store/Store";

export const GetPrivacyPolicyFunc = async (
    { parent, info, args, context: { req } },
    stack: any[]
): Promise<GetPrivacyPolicyResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeCode } = args as GetPrivacyPolicyQueryArgs;
        const store = await StoreModel.findByCode(storeCode);
        if (!store) {
            throw new Error("존재하지 않는 Store");
        }

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: null
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Query: {
        GetPrivacyPolicy: defaultResolver(privateResolver(GetPrivacyPolicyFunc))
    }
};
export default resolvers;
