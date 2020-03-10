/* eslint-disable @typescript-eslint/camelcase */
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    UpdateMyProfileForBuyerResponse,
    UpdateMyProfileForBuyerInput
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import { AttributeType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { CountryInfoModel } from "../../../models/CountryInfo";
import CognitoIdentityServiceProvider = require("aws-sdk/clients/cognitoidentityserviceprovider");
import { refreshToken } from "../../../utils/refreshToken";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";

export const UpdateMyProfileForBuyerFunc = async (
    { args, context: { req } },
    stack: any[]
): Promise<UpdateMyProfileForBuyerResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoBuyer } = req;
        const { sub } = cognitoBuyer;
        const {
            param: { name, phoneNumber, roles, timezone }
        }: { param: UpdateMyProfileForBuyerInput } = args;
        let user = await UserModel.findOne({ sub });
        if (!user) {
            user = new UserModel({
                sub
            });
        }
        const attributes: AttributeType[] = [];
        if (name) {
            user.name = name;
            attributes.push({
                Name: "name",
                Value: name
            });
        }
        if (timezone) {
            const zoneinfo = await CountryInfoModel.getZoneinfo(timezone);
            user.zoneinfo = zoneinfo;
            attributes.push({
                Name: "zoneinfo",
                Value: JSON.stringify(zoneinfo)
            });
        }
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
        if (roles && roles.length !== 0) {
            user.roles = roles;
        }
        stack.push({ cognitoUser: cognitoBuyer });
        stack.push({ user });
        const cognito = new CognitoIdentityServiceProvider();
        const cognitoUpdateResult = await cognito
            .adminUpdateUserAttributes({
                UserAttributes: attributes,
                UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
                Username: cognitoBuyer["cognito:username"] || cognitoBuyer.sub
            })
            .promise();
        if (cognitoUpdateResult.$response.error) {
            throw cognitoUpdateResult.$response.error;
        }
        const refreshResult = await refreshToken(user.refreshToken, "BUYER");
        if (!refreshResult.ok || !refreshResult.data) {
            throw new ApolloError(
                "Token Refresh 실패",
                ERROR_CODES.TOKEN_REFRESH_FAIL
            );
        }
        user.refreshToken = refreshResult.data.refreshToken;
        user.refreshTokenLastUpdate = new Date();
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            // Let's return Refreshed Token
            data: refreshResult.data.idToken
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        UpdateMyProfileForBuyer: defaultResolver(
            privateResolver(UpdateMyProfileForBuyerFunc)
        )
    }
};
export default resolvers;
