import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { SignOutResponse, UserRole } from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";

export const SignOutFunc = async (
    { parent, info, args, context: { req, res } },
    stack: any[]
): Promise<SignOutResponse> => {
    try {
        // const { cognitoUser } = req;
        const { role }: { role: UserRole } = args;
        if (role === "SELLER") {
            req.session.seller = {};
        } else if (role === "BUYER") {
            req.session.buyer = {};
        }
        req.session.save(err => {
            if (err) {
                throw new err();
            }
        });
        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return await errorReturn(error);
    }
};

const resolvers: Resolvers = {
    Mutation: {
        SignOut: defaultResolver(SignOutFunc)
    }
};
export default resolvers;
