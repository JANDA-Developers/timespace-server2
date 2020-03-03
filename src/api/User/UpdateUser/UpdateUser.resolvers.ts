/* eslint-disable @typescript-eslint/camelcase */
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { UpdateUserResponse, UpdateUserInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import { AttributeType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { CountryInfoModel } from "../../../models/CountryInfo";
import CognitoIdentityServiceProvider = require("aws-sdk/clients/cognitoidentityserviceprovider");

export const UpdateUserFunc = async (
    { args, context: { req } },
    stack: any[]
): Promise<UpdateUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { sub } = cognitoUser;
        const {
            param: { name, phoneNumber, roles, timezone }
        }: { param: UpdateUserInput } = args;
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
        stack.push({ cognitoUser });
        stack.push({ user });
        const cognito = new CognitoIdentityServiceProvider();
        const cognitoUpdateResult = await cognito
            .adminUpdateUserAttributes({
                UserAttributes: attributes,
                UserPoolId: process.env.COGNITO_POOL_ID || "",
                Username: cognitoUser["cognito:username"] || cognitoUser.sub
            })
            .promise();
        if (cognitoUpdateResult.$response.error) {
            throw cognitoUpdateResult.$response.error;
        }
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: user as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        UpdateUser: defaultResolver(privateResolver(UpdateUserFunc))
    }
};
export default resolvers;
