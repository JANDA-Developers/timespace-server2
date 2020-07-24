import { ApolloError } from "apollo-server";
import { DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { SignInStoreResponse, SignInStoreMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreGroup
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreCls } from "../../../models/Store/Store";
import {
    StoreUserModel,
    StoreUserCls
} from "../../../models/StoreUser/StoreUser";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ObjectId } from "mongodb";
import { decodeKeyForBuyer } from "../../../utils/decodeIdToken";
import { BuyerModel, BuyerCls } from "../../../models/Buyer";
import { StoreGroupCls } from "../../../models/StoreGroup";

export const SignInStoreMainFunc = async ({
    args,
    context: { req }
}): Promise<SignInStoreResponse> => {
    try {
        const {
            store,
            storeGroup
        }: {
            store?: DocumentType<StoreCls>;
            storeGroup: DocumentType<StoreGroupCls>;
        } = req;
        const storeId = store?._id;
        const storeCode = store?.code;
        const storeGroupId = storeGroup._id;
        const storeGroupCode = storeGroup.code;

        const { email, password } = args as SignInStoreMutationArgs;

        if (storeGroup.signUpOption.userAccessRange === "STORE" && !store) {
            throw new ApolloError(
                "존재하지 않는 StoreCode.",
                ERROR_CODES.UNEXIST_STORE_CODE
            );
        }

        const storeUser = await StoreUserModel.findOne({
            email,
            storeGroupId,
            storeGroupCode
        });

        if (storeUser) {
            // 만약에 storeUser == undefined 인 경우,
            await comparePasswordForStoreUser(storeUser, password);
            setSessionData(req, storeUser, storeGroupCode);
        } else {
            const buyer = await signInWithBuyerAccount(email, password);
            if (!buyer) {
                throw new ApolloError(
                    "ID 또는 Password를 확인해 주세요.",
                    ERROR_CODES.UNEXIST_STORE_USER
                );
            }
            if (buyer) {
                const storeUser = await StoreUserModel.findOne({
                    email: buyer.email
                }).exec();
                if (storeUser) {
                    throw new ApolloError(
                        "ID 또는 Password를 확인해 주세요.",
                        ERROR_CODES.UNEXIST_STORE_USER
                    );
                }
                const migratedStoreUser = await migrateBuyerToStoreUser(
                    buyer,
                    {
                        email,
                        password,
                        company: buyer.company
                    },
                    {
                        storeCode,
                        storeId,
                        storeGroupCode,
                        storeGroupId
                    }
                );

                await migratedStoreUser.save();

                // 우선은 StoreGroupCode 위주로 되어있음.
                setSessionData(req, migratedStoreUser, storeGroupCode);
            }
        }
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error);
    }
};
const comparePasswordForStoreUser = async (
    storeUser: DocumentType<StoreUserCls>,
    password: string
) => {
    const isCorrectPassword = await storeUser.comparePassword(password);
    if (!isCorrectPassword) {
        throw new ApolloError(
            "ID 또는 Password를 확인해 주세요.",
            ERROR_CODES.UNEXIST_STORE_USER
        );
    }
};

const signInWithBuyerAccount = async (
    email: string,
    password: string
): Promise<DocumentType<BuyerCls> | undefined> => {
    const cognito = new CognitoIdentityServiceProvider();
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
    const token = AuthenticationResult?.IdToken;
    if (!AuthenticationResult || !token) {
        throw cognitoSignInResult.$response.error;
    }
    try {
        const { data } = await decodeKeyForBuyer(token);
        const buyer = await BuyerModel.findBuyer(data);
        return buyer;
    } catch (error) {
        return undefined;
    }
};

const migrateBuyerToStoreUser = async (
    buyer: DocumentType<BuyerCls>,
    accountInfo: {
        email: string;
        password: string;
        company: string;
    },
    storeInfo: {
        storeId?: ObjectId;
        storeCode?: string;
        storeGroupId: ObjectId;
        storeGroupCode: string;
    }
): Promise<DocumentType<StoreUserCls>> => {
    // FIXME: zoneInfo undefined문제 해결 ㄱㄱ
    const storeUser = new StoreUserModel({
        name: buyer.name,
        phoneNumber: buyer.phone_number,
        verifiedPhoneNumber: buyer.phone_number_verified || false,
        verifiedEmail: buyer.email_verified || false,
        ...storeInfo,
        ...accountInfo
    });
    storeUser.buyerSub = buyer.sub;
    const zoneinfo = buyer.zoneinfo;
    if (typeof zoneinfo === "string") {
        await storeUser.setZoneinfo(JSON.parse(zoneinfo).tz);
    } else {
        await storeUser.setZoneinfo(zoneinfo.tz);
    }
    // name, password, email, zoneinfo, phoneNumber, storeid, storeCode, verifiedPhoneNumber;
    await storeUser.hashPassword();
    return storeUser;
};

const setSessionData = (
    req: any,
    storeUser: DocumentType<StoreUserCls>,
    storeGroupCode: string
) => {
    if (!req.session.storeGroupUsers) {
        req.session.storeGroupUsers = {
            [storeGroupCode]: storeUser.toObject()
        };
    } else {
        req.session.storeGroupUsers[storeGroupCode] = storeUser.toObject();
    }

    req.session.save((err: any) => {
        if (err) {
            throw new err();
        }
    });
};

const resolvers: Resolvers = {
    Mutation: {
        SignInStore: defaultResolver(
            privateResolverForStoreGroup(SignInStoreMainFunc)
        )
    }
};
export default resolvers;
