"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignUpStoreFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
const helper_1 = require("../../../models/helpers/helper");
const SignInStore_resolvers_1 = require("../SignInStore/SignInStore.resolvers");
exports.SignUpStoreFunc = async ({ args, context: { req } }) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        console.log("SginUpStore....");
        console.log("SginUpStore....");
        // store 또는 storeGroup
        const { store, storeGroup } = req;
        const { param } = args;
        await validateParams(args, storeGroup);
        const storeUser = await createStoreUser(param, storeGroup, store);
        await storeUser.save({ session });
        console.log({ storeUser });
        SignInStore_resolvers_1.setStoreUserSessionData(req, storeUser, storeGroup.code);
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: storeUser
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const validateParams = async (args, storeGroup) => {
    await helper_1.isExistingStoreUser(args.param.email, storeGroup.code);
};
const createStoreUser = async ({ email, timezone, phoneNumber, ...param }, storeGroup, store) => {
    const storeUser = new StoreUser_1.StoreUserModel(param);
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
const resolvers = {
    Mutation: {
        SignUpStore: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.SignUpStoreFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=SignUpStore.resolvers.js.map