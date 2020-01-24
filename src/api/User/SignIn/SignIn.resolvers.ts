import { Resolvers } from "../../../types/resolvers";
import { CognitoIdentityServiceProvider } from "aws-sdk";

const resolvers: Resolvers = {
    Mutation: {
        SignIn: async (): Promise<any> => {
            try {
                const cognito = new CognitoIdentityServiceProvider();
                // const authResult = await cognito.initiateAuth({
                //     AuthFlow: "USER_SRP_AUTH",
                //     ClientId: process.env.COGNITO_CLIENT_ID
                // });
                throw new Error("개발중");
            } catch (error) {
                return {
                    ok: false,
                    error: {
                        code: 100,
                        msg: error.message
                    }
                };
            }
        }
    }
};
export default resolvers;
