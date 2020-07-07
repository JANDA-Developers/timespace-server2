import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { UpdateStoreGroupResponse, UpdateStoreGroupInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreGroupCls, StoreGroupModel } from "../../../models/StoreGroup";
import { UserCls } from "../../../models/User";
import { ERROR_CODES } from "../../../types/values";
import { ApolloError } from "apollo-server";

const resolvers: Resolvers = {
    Mutation: {
        UpdateStoreGroup: defaultResolver(
            privateResolver(
                async ({
                    args: { param, groupCode },
                    context: { req }
                }): Promise<UpdateStoreGroupResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { user }: { user: DocumentType<UserCls> } = req;
                        const storeGroup: DocumentType<StoreGroupCls> = await StoreGroupModel.findByCode(
                            groupCode
                        );
                        if (!storeGroup.userId.equals(user._id)) {
                            throw new ApolloError(
                                "해당 StoreGroup에 대한 접근권한이 없습니다.",
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
    { description, designConfig, name, guestUserConfig }: UpdateStoreGroupInput
) => {
    if (name) {
        storeGroup.name = name;
    }
    if (description) {
        storeGroup.description = description;
    }
    if (designConfig) {
        storeGroup.config.design = designConfig;
        storeGroup.designOption = designConfig;
    }

    if (guestUserConfig) {
        if (guestUserConfig.acceptAnonymousUser) {
            storeGroup.signUpOption.acceptAnonymousUser =
                guestUserConfig.acceptAnonymousUser;
        }
        if (guestUserConfig.signUpPermission != null) {
            storeGroup.signUpOption.signUpPermission =
                guestUserConfig.signUpPermission;
        }
        if (guestUserConfig.userAccessRange) {
            storeGroup.signUpOption.userAccessRange =
                guestUserConfig.userAccessRange;
        }
    }
};
export default resolvers;
