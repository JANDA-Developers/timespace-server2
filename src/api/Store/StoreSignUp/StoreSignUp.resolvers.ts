import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { StoreSignUpResponse, StoreSignUpMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolverForStore
} from "../../../utils/resolverFuncWrapper";
import { StoreCls } from "../../../models/Store/Store";
import { StoreUserModel } from "../../../models/StoreUser";

export const StoreSignUpFunc = async ({
    args,
    context: { req }
}): Promise<StoreSignUpResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { store }: { store: DocumentType<StoreCls> } = req;
        const {
            param: { timezone, phoneNumber, email, ...param }
        } = args as StoreSignUpMutationArgs;
        const storeUser = new StoreUserModel(param);
        storeUser.setPhoneNumber(phoneNumber);
        storeUser.setEmail(email);
        await storeUser.setZoneinfo(timezone);
        storeUser.setStoreCode(store);
        await storeUser.hashPassword();

        await storeUser.save({ session });

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: storeUser as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        StoreSignUp: defaultResolver(privateResolverForStore(StoreSignUpFunc))
    }
};
export default resolvers;
