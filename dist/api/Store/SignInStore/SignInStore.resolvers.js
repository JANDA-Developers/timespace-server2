"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStoreUserSessionData = exports.SignInStoreMainFunc = void 0;
const apollo_server_1 = require("apollo-server");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const values_1 = require("../../../types/values");
const StoreUser_1 = require("../../../models/StoreUser/StoreUser");
const aws_sdk_1 = require("aws-sdk");
const decodeIdToken_1 = require("../../../utils/decodeIdToken");
const Buyer_1 = require("../../../models/Buyer");
exports.SignInStoreMainFunc = async ({ args, context: { req } }) => {
    try {
        const { store, storeGroup } = req;
        console.log({ req });
        const storeId = store === null || store === void 0 ? void 0 : store._id;
        const storeCode = store === null || store === void 0 ? void 0 : store.code;
        const storeGroupId = storeGroup._id;
        const storeGroupCode = storeGroup.code;
        const { email, password } = args;
        if (storeGroup.signUpOption.userAccessRange === "STORE" && !store) {
            throw new apollo_server_1.ApolloError("존재하지 않는 StoreCode.", values_1.ERROR_CODES.UNEXIST_STORE_CODE);
        }
        const storeUser = await StoreUser_1.StoreUserModel.findOne({
            email,
            storeGroupId,
            storeGroupCode
        });
        if (storeUser) {
            // 만약에 storeUser == undefined 인 경우,
            await comparePasswordForStoreUser(storeUser, password);
            exports.setStoreUserSessionData(req, storeUser, storeGroupCode);
        }
        else {
            const buyer = await signInWithBuyerAccount(email, password);
            if (!buyer) {
                throw new apollo_server_1.ApolloError("ID 또는 Password를 확인해 주세요.", values_1.ERROR_CODES.UNEXIST_STORE_USER);
            }
            if (buyer) {
                const storeUser = await StoreUser_1.StoreUserModel.findOne({
                    email: buyer.email
                }).exec();
                if (storeUser) {
                    throw new apollo_server_1.ApolloError("ID 또는 Password를 확인해 주세요.", values_1.ERROR_CODES.UNEXIST_STORE_USER);
                }
                const migratedStoreUser = await migrateBuyerToStoreUser(buyer, {
                    email,
                    password,
                    company: buyer.company
                }, {
                    storeCode,
                    storeId,
                    storeGroupCode,
                    storeGroupId
                });
                await migratedStoreUser.save();
                // 우선은 StoreGroupCode 위주로 되어있음.
                exports.setStoreUserSessionData(req, migratedStoreUser, storeGroupCode);
            }
        }
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error);
    }
};
const comparePasswordForStoreUser = async (storeUser, password) => {
    const isCorrectPassword = await storeUser.comparePassword(password);
    if (!isCorrectPassword) {
        throw new apollo_server_1.ApolloError("ID 또는 Password를 확인해 주세요.", values_1.ERROR_CODES.UNEXIST_STORE_USER);
    }
};
const signInWithBuyerAccount = async (email, password) => {
    const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
    const cognitoSignInResult = await cognito
        .adminInitiateAuth({
        UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
        ClientId: process.env.COGNITO_CLIENT_ID_BUYER || "",
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    })
        .promise();
    const { AuthenticationResult } = cognitoSignInResult;
    const token = AuthenticationResult === null || AuthenticationResult === void 0 ? void 0 : AuthenticationResult.IdToken;
    if (!AuthenticationResult || !token) {
        throw cognitoSignInResult.$response.error;
    }
    try {
        const { data } = await decodeIdToken_1.decodeKeyForBuyer(token);
        const buyer = await Buyer_1.BuyerModel.findBuyer(data);
        return buyer;
    }
    catch (error) {
        return undefined;
    }
};
const migrateBuyerToStoreUser = async (buyer, accountInfo, storeInfo) => {
    // FIXME: zoneInfo undefined문제 해결 ㄱㄱ
    const storeUser = new StoreUser_1.StoreUserModel({
        name: buyer.name,
        phoneNumber: buyer.phone_number,
        verifiedPhoneNumber: true,
        verifiedEmail: buyer.email_verified || false,
        ...storeInfo,
        ...accountInfo
    });
    storeUser.buyerSub = buyer.sub;
    const zoneinfo = buyer.zoneinfo;
    if (typeof zoneinfo === "string") {
        await storeUser.setZoneinfo(JSON.parse(zoneinfo).tz);
    }
    else {
        await storeUser.setZoneinfo(zoneinfo.tz);
    }
    // name, password, email, zoneinfo, phoneNumber, storeid, storeCode, verifiedPhoneNumber;
    await storeUser.hashPassword();
    return storeUser;
};
exports.setStoreUserSessionData = (req, storeUser, storeGroupCode) => {
    if (!req.session.storeGroupUsers) {
        req.session.storeGroupUsers = {
            [storeGroupCode]: storeUser.toObject()
        };
    }
    else {
        req.session.storeGroupUsers[storeGroupCode] = storeUser.toObject();
    }
    console.log({ storeGroupUsers: req.session.storeGroupUsers });
    req.session.save((err) => {
        if (err) {
            throw new err();
        }
    });
};
const resolvers = {
    Mutation: {
        SignInStore: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolverForStoreGroup(exports.SignInStoreMainFunc))
    }
};
exports.default = resolvers;
//# sourceMappingURL=SignInStore.resolvers.js.map