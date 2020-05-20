import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { UpdateStoreGroupResponse, UpdateStoreGroupInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreGroupCls, StoreGroupModel } from "../../../models/StoreGroup";
import { ObjectId } from "mongodb";

const resolvers: Resolvers = {
    Mutation: {
        UpdateStoreGroup: defaultResolver(
            privateResolver(
                async (
                    {
                        parent,
                        info,
                        args: { param, groupCode },
                        context: { req }
                    },
                    stack
                ): Promise<UpdateStoreGroupResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const storeGroup: DocumentType<StoreGroupCls> = await StoreGroupModel.findByCode(
                            groupCode
                        );
                        if (
                            !new ObjectId(cognitoUser._id).equals(
                                storeGroup._id
                            )
                        ) {
                            throw new ApolloError(
                                "업데이트 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE_GROUP
                            );
                        }
                        setParamsToStoreGroupObject(storeGroup, param);

                        await storeGroup.save({ session });

                        await session.commitTransaction();
                        session.endSession();
                        return {
                            ok: true,
                            error: null,
                            data: storeGroup as any
                        };
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};

const setParamsToStoreGroupObject = (
    storeGroup: DocumentType<StoreGroupCls>,
    { description, designConfig, name }: UpdateStoreGroupInput
) => {
    if (name) {
        storeGroup.name = name;
    }
    if (description) {
        storeGroup.description = description;
    }
    if (designConfig) {
        storeGroup.config.design = designConfig;
    }
};
export default resolvers;
