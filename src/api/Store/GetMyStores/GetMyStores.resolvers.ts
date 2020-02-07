import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetMyStoresResponse } from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    Query: {
        GetMyStores: defaultResolver(
            privateResolver(
                async ({ context: { req } }): Promise<GetMyStoresResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;

                        const stores = await StoreModel.find({
                            user: new ObjectId(cognitoUser._id)
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
