/* eslint-disable @typescript-eslint/camelcase */
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    AdminUpdateUserResponse,
    AdminUpdateUserInput,
    UserRole
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";
import CognitoIdentityServiceProvider, {
    AttributeType
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import { CountryInfoModel } from "../../../models/CountryInfo";
import { BuyerModel } from "../../../models/Buyer";

export const AdminUpdateUserFunc = async ({
    args
}): Promise<AdminUpdateUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // TODO: 참고...
        // https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminUpdateUserAttributes.html
        const { param }: { param: AdminUpdateUserInput } = args;
        const {
            role,
            updateParam: { smsKey, phoneNumber, timezone, name }
        } = param;
        const user: any =
            role === "SELLER"
                ? await UserModel.findBySub(param.userSub)
                : await BuyerModel.findBySub(param.userSub);
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
        if (smsKey && role === "SELLER") {
            user.smsKey = smsKey;
            attributes.push({
                Name: "custom:smsKey",
                Value: smsKey
            });
        }
        // Cognito 업데이트
        await cognitoUserInfoUpdate(user.sub, role, attributes);

        // 업데이트된 Cognito Token을 가져온다
        // const { idToken } = await refreshUserToken(user);
        await user.save({
            session
        });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: ""
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const cognitoUserInfoUpdate = async (
    sub: string,
    role: UserRole,
    attributes: AttributeType[]
) => {
    const cognito = new CognitoIdentityServiceProvider();
    const cognitoUpdateResult = await cognito
        .adminUpdateUserAttributes({
            UserAttributes: attributes,
            UserPoolId:
                (role === "SELLER"
                    ? process.env.COGNITO_POOL_ID
                    : process.env.COGNITO_POOL_ID_BUYER) || "",
            Username: sub
        })
        .promise();
    if (cognitoUpdateResult.$response.error) {
        throw cognitoUpdateResult.$response.error;
    }
};

// const refreshUserToken = async (user: DocumentType<UserCls>) => {
//     const refreshResult = await refreshToken(user.refreshToken, "SELLER");
//     if (!refreshResult.ok || !refreshResult.data) {
//         throw new ApolloError(
//             "Token Refresh 실패",
//             ERROR_CODES.TOKEN_REFRESH_FAIL
//         );
//     }
//     user.refreshToken = refreshResult.data.refreshToken;
//     user.refreshTokenLastUpdate = new Date();
//     return refreshResult.data;
// };

const resolvers: Resolvers = {
    Mutation: {
        AdminUpdateUser: defaultResolver(privateResolver(AdminUpdateUserFunc))
    }
};
export default resolvers;
