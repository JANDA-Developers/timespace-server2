import { ApolloError } from "apollo-server";
import { DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { StoreSignInResponse, StoreSignInMutationArgs } from "GraphType";
import {
    defaultResolver,
    privateResolverForStore
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreCls } from "../../../models/Store/Store";
import { StoreUserModel, StoreUserCls } from "../../../models/StoreUser";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ObjectId } from "mongodb";
import { decodeKeyForBuyer } from "../../../utils/decodeIdToken";
import { BuyerModel, BuyerCls } from "../../../models/Buyer";

export const StoreSignInMainFunc = async ({
    args,
    context: { req }
}): Promise<StoreSignInResponse> => {
    try {
        const { store }: { store: DocumentType<StoreCls> } = req;
        const storeId = store._id;
        const storeCode = store.code;
        const { email, password } = args as StoreSignInMutationArgs;

        const storeUser = await StoreUserModel.findOne({
            storeId,
            email
        });

        if (storeUser) {
            // 만약에 storeUser == undefined 인 경우,
            await comparePasswordForStoreUser(storeUser, password);
            setSessionData(req, storeUser, storeCode);
        } else {
            const buyer = await signInWithBuyerAccount(email, password);
            if (!buyer) {
                throw new ApolloError(
                    "ID 또는 Password를 확인해 주세요.",
                    ERROR_CODES.UNEXIST_STORE_USER
                );
            }
            if (buyer) {
                const migratedStoreUser = await migrateBuyerToStoreUser(
                    buyer,
                    {
                        email,
                        password
                    },
                    {
                        storeCode,
                        storeId
                    }
                );

                await migratedStoreUser.save();

                setSessionData(req, migratedStoreUser, storeCode);
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
    },
    storeInfo: {
        storeId: ObjectId;
        storeCode: string;
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
    const zoneinfo = buyer.zoneinfo;
    if (typeof zoneinfo === "string") {
        storeUser.setZoneinfo(JSON.parse(zoneinfo).tz);
    } else {
        storeUser.setZoneinfo(zoneinfo.tz);
    }
    // name, password, email, zoneinfo, phoneNumber, storeid, storeCode, verifiedPhoneNumber;
    await storeUser.hashPassword();
    return storeUser;
};

const setSessionData = (
    req: any,
    storeUser: DocumentType<StoreUserCls>,
    storeCode: string
) => {
    if (!req.session.storeUsers) {
        req.session.storeUsers = {
            [storeCode]: storeUser.toObject()
        };
    } else {
        req.session.storeUsers[storeCode] = storeUser.toObject();
    }

    req.session.save((err: any) => {
        if (err) {
            throw new err();
        }
    });
};

const resolvers: Resolvers = {
    Mutation: {
        StoreSignIn: defaultResolver(
            privateResolverForStore(StoreSignInMainFunc)
        )
    }
};
export default resolvers;
