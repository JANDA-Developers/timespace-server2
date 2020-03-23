/* eslint-disable @typescript-eslint/camelcase */
import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { AdminUpdateUserResponse, AdminUpdateUserInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { UserModel, UserCls } from "../../../models/User";
import CognitoIdentityServiceProvider, {
    AttributeType
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import { CountryInfoModel } from "../../../models/CountryInfo";
import { refreshToken } from "../../../utils/refreshToken";
import { ObjectId } from "mongodb";

export const AdminUpdateUserFunc = async ({
    args
}): Promise<AdminUpdateUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // TODO: 참고...
        // https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminUpdateUserAttributes.html
        const { param }: { param: AdminUpdateUserInput } = args;
        const user = await UserModel.findBySub(param.userSub);
        const {
            updateParam: { smsKey, phoneNumber, timezone, name }
        } = param;
        const attributes: AttributeType[] = [];
        if (phoneNumber) {
            const phoneNum = `${user.zoneinfo.callingCode}${phoneNumber}`;
            user.phone_number = phoneNum;
            attributes.push(
                {
                    Name: "phone_number",
                    Value: phoneNum
                },
                {
                    Name: "phone_number_verified",
                    Value: "false"
                }
            );
        }
        if (timezone) {
            const zoneinfo = await CountryInfoModel.getZoneinfo(timezone);
            user.zoneinfo = zoneinfo;
            attributes.push({
                Name: "zoneinfo",
                Value: JSON.stringify(zoneinfo)
            });
        }
        if (name) {
            user.name = name;
            attributes.push({
                Name: "name",
                Value: name
            });
        }
        if (smsKey) {
            user.smsKey = new ObjectId(smsKey);
            attributes.push({
                Name: "custom:smsKey",
                Value: smsKey
            });
        }
        // Cognito 업데이트
        await cognitoUserInfoUpdate(user.sub, attributes);

        // 업데이트된 Cognito Token을 가져온다
        const idToken = await refreshUserToken(user);
        await user.save({
            session
        });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: idToken
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const cognitoUserInfoUpdate = async (
    sub: string,
    attributes: AttributeType[]
) => {
    const cognito = new CognitoIdentityServiceProvider();
    const cognitoUpdateResult = await cognito
        .adminUpdateUserAttributes({
            UserAttributes: attributes,
            UserPoolId: process.env.COGNITO_POOL_ID || "",
            Username: sub
        })
        .promise();
    if (cognitoUpdateResult.$response.error) {
        throw cognitoUpdateResult.$response.error;
    }
};

const refreshUserToken = async (
    user: DocumentType<UserCls>
): Promise<string> => {
    const refreshResult = await refreshToken(user.refreshToken, "SELLER");
    if (!refreshResult.ok || !refreshResult.data) {
        throw new ApolloError(
            "Token Refresh 실패",
            ERROR_CODES.TOKEN_REFRESH_FAIL
        );
    }
    user.refreshToken = refreshResult.data.refreshToken;
    user.refreshTokenLastUpdate = new Date();
    return refreshResult.data.idToken;
};

const resolvers: Resolvers = {
    Mutation: {
        AdminUpdateUser: defaultResolver(privateResolver(AdminUpdateUserFunc))
    }
};
export default resolvers;
