import { ApolloError } from "apollo-server";
import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CreateItemForBuyerResponse,
    CreateItemForBuyerInput
} from "../../../types/graph";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";

const resolvers: Resolvers = {
    Mutation: {
        CreateItemForBuyer: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<CreateItemForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const {
                            buyer,
                            description,
                            name,
                            storeId,
                            dateTimeRange
                        } = param as CreateItemForBuyerInput;
                        console.log({
                            buyer,
                            description,
                            name,
                            storeId,
                            dateTimeRange,
                            cognitoUser
                        });

                        throw new ApolloError("개발중", "UNDERDEVELOPMENT");
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};
export default resolvers;
