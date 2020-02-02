import { Resolvers } from "../../../types/resolvers";
import {
    EmailSignUpMutationArgs,
    EmailSignUpResponse
} from "../../../types/graph";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { UserModel } from "../../../models/User";

const resolvers: Resolvers = {
    Mutation: {
        EmailSignUp: defaultResolver(
            async (
                _,
                { param }: EmailSignUpMutationArgs
            ): Promise<EmailSignUpResponse> => {
                try {
                    const {
                        username,
                        email,
                        password,
                        phoneNumber,
                        countryCode,
                        city
                    } = param;

                    const cognito = new CognitoIdentityServiceProvider();
                    const result = await cognito
                        .signUp({
                            ClientId: process.env.COGNITO_CLIENT_ID || "",
                            Username: email,
                            Password: password,
                            UserAttributes: [
                                {
                                    Name: "name",
                                    Value: username
                                },
                                {
                                    Name: "email",
                                    Value: email
                                },
                                {
                                    Name: "phone_number",
                                    Value: (countryCode || "+82") + phoneNumber
                                },
                                {
                                    Name: "zoneinfo",
                                    Value: city
                                }
                            ]
                        })
                        .promise();
                    await UserModel.create({
                        sub: result.UserSub,
                        loginInfos: []
                    });
                    return {
                        ok: true,
                        error: null,
                        data: {
                            CodeDeliveryDetails:
                                (result.CodeDeliveryDetails && {
                                    AttributeName:
                                        result.CodeDeliveryDetails
                                            .AttributeName || null,
                                    DeliveryMedium:
                                        result.CodeDeliveryDetails
                                            .DeliveryMedium || null,
                                    Destination:
                                        result.CodeDeliveryDetails
                                            .Destination || null
                                }) ||
                                null,
                            UserConfirmed: result.UserConfirmed,
                            UserSub: result.UserSub
                        }
                    };
                } catch (error) {
                    return {
                        ok: false,
                        error: {
                            code: "100",
                            msg: error.message
                        },
                        data: null
                    };
                }
            }
        )
    }
};
export default resolvers;
