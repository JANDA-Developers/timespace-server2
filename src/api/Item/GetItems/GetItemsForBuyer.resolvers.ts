import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { GetItemsForBuyerResponse, GetItemsForBuyerInput } from "GraphType";
import {
    defaultResolver,
    privateResolverForBuyer
} from "../../../utils/resolverFuncWrapper";
import { makeFilterQuery } from "./itemFilter";
import { UserModel } from "../../../models/User";
import { ItemModel } from "../../../models/Item/Item";

const resolvers: Resolvers = {
    Query: {
        GetItemsForBuyer: defaultResolver(
            privateResolverForBuyer(
                async (
                    { args, context: { req } },
                    stack
                ): Promise<GetItemsForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoBuyer } = req;
                        const {
                            param
                        }: { param: GetItemsForBuyerInput } = args;
                        const user = await UserModel.findBySub(
                            cognitoBuyer.sub
                        );
                        console.log(user);

                        const query = makeFilterQuery(
                            param.filter,
                            user.zoneinfo.offset
                        );

                        const items = await ItemModel.find({
                            buyerId: user._id,
                            expiresAt: {
                                $exists: false
                            },
                            ...query
                        }).sort({ createdAt: -1 });

                        return {
                            ok: true,
                            error: null,
                            data: items as any
                        };
                    } catch (error) {
                        const reuslt = await errorReturn(error, session);
                        return {
                            ...reuslt,
                            data: []
                        };
                    }
                }
            )
        )
    }
};
export default resolvers;
