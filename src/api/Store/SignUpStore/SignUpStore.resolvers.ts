import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    SignUpStoreResponse,
    SignUpStoreMutationArgs,
    SignUpStoreInput
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { StoreCls } from "../../../models/Store/Store";
import {
    StoreUserModel,
    StoreUserCls
} from "../../../models/StoreUser/StoreUser";
import { StoreGroupCls } from "../../../models/StoreGroup";
import { isExistingStoreUser } from "../../../models/helpers/helper";
import { setStoreUserSessionData } from "../SignInStore/SignInStore.resolvers";

export const SignUpStoreFunc = async ({
    args,
    context: { req }
}): Promise<SignUpStoreResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log("SginUpStore....");
        console.log("SginUpStore....");
        // store 또는 storeGroup
        const {
            store,
            storeGroup
        }: {
            store?: DocumentType<StoreCls>;
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const { param } = args as SignUpStoreMutationArgs;
        await validateParams(args, storeGroup);

        const storeUser = await createStoreUser(param, storeGroup, store);
        await storeUser.save({ session });

        console.log({ storeUser });

        setStoreUserSessionData(req, storeUser, storeGroup.code);

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

const validateParams = async (
    args: SignUpStoreMutationArgs,
    storeGroup: DocumentType<StoreGroupCls>
) => {
    await isExistingStoreUser(args.param.email, storeGroup.code);
};

const createStoreUser = async (
    { email, timezone, phoneNumber, ...param }: SignUpStoreInput,
    storeGroup: DocumentType<StoreGroupCls>,
    store?: DocumentType<StoreCls>
): Promise<DocumentType<StoreUserCls>> => {
    const storeUser = new StoreUserModel(param);
    console.log("createStoreUser");
    console.log({ storeUser });
    storeUser.setPhoneNumber(phoneNumber);
    storeUser.setEmail(email);
    await storeUser.setZoneinfo(timezone);
    storeUser.setStoreGroupCode(storeGroup);
    if (store) {
        storeUser.setStoreCode(store);
    }
    await storeUser.hashPassword();
    return storeUser;
};

const resolvers: Resolvers = {
    Mutation: {
        SignUpStore: defaultResolver(
            privateResolverForStoreGroup(SignUpStoreFunc)
        )
    }
};

export default resolvers;
