import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetMyStoresResponse } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { UserModel } from "../../../models/User";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";

const resolvers: Resolvers = {
    Query: {
        GetMyStores: defaultResolver(
            privateResolver(
                async ({ context: { req } }): Promise<GetMyStoresResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;

                        const user = await UserModel.findById(cognitoUser._id);
                        if (!user) {
                            throw new ApolloError(
                                "존재하지 않는 UserId",
                                ERROR_CODES.UNEXIST_USER
                            );
                        }

                        const stores = await StoreModel.find({
                            _id: {
                                $in: user.stores
                            }
                        });
                        return {
                            ok: true,
                            error: null,
                            data: stores as any
                        };
                    } catch (error) {
                        return {
                            ...(await errorReturn(error, session)),
                            data: []
                        };
                    }
                }
            )
        )
    }
};
export default resolvers;
