import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    UpdateStoreGroupResponse,
    UpdateStoreGroupInput,
    StoreDesignConfig
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreGroupCls, StoreGroupModel } from "../../../models/StoreGroup";
import { ERROR_CODES } from "../../../types/values";
import { ApolloError } from "apollo-server";
import { uploadFile } from "../../../utils/s3Funcs";

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
                        const { cognitoUser } = req;
                        const storeGroup: DocumentType<StoreGroupCls> = await StoreGroupModel.findByCode(
                            groupCode
                        );
                        if (!storeGroup.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "해당 StoreGroup에 대한 접근권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE_GROUP
                            );
                        }
                        await setParamsToStoreGroupObject(
                            storeGroup,
                            param,
                            cognitoUser
                        );

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

const setParamsToStoreGroupObject = async (
    storeGroup: DocumentType<StoreGroupCls>,
    { description, designConfig, name, guestUserConfig }: UpdateStoreGroupInput,
    user: any
) => {
    if (name) {
        storeGroup.name = name;
    }
    if (description) {
        storeGroup.description = description;
    }
    if (designConfig) {
        const { color, link, logo, iconLogo } = designConfig;

        if (logo) {
            const syncedLogo = await logo;
            const { url } = await uploadFile(syncedLogo, {
                dir: `${user.sub}/storegroup/${storeGroup.code}/design/logos/`
            });
            storeGroup.designOption.logo = storeGroup.config.design.logo = url;
        }

        if (iconLogo) {
            const syncedLogo = await iconLogo;
            const { url } = await uploadFile(syncedLogo, {
                dir: `${user.sub}/storegroup/${storeGroup.code}/design/appicon/`
            });
            storeGroup.designOption.iconLogo = storeGroup.config.design.iconLogo = url;
        }

        if (color) {
            storeGroup.designOption.color = storeGroup.config.design.color = color;
        }

        if (link) {
            storeGroup.designOption.link = storeGroup.config.design.link = link;
        }
        const tempDesignConfig: StoreDesignConfig = {
            color: storeGroup.config.design.color || designConfig.color,
            iconLogo:
                storeGroup.config.design.iconLogo || designConfig.iconLogo,
            link: storeGroup.config.design.link || designConfig.link,
            logo: storeGroup.config.design.logo || designConfig.logo
        };
        storeGroup.designOption = tempDesignConfig;
        storeGroup.config = { ...storeGroup.config, design: tempDesignConfig };
        console.log({ designConfig: storeGroup.designOption });
    }

    if (guestUserConfig) {
        const temp = { ...storeGroup.signUpOption };
        if (guestUserConfig.acceptAnonymousUser != null) {
            temp.acceptAnonymousUser = guestUserConfig.acceptAnonymousUser;
            // storeGroup.signUpOption.acceptAnonymousUser =
            //     guestUserConfig.acceptAnonymousUser;
        }
        if (guestUserConfig.userAccessRange) {
            // storeGroup.signUpOption.userAccessRange =
            temp.userAccessRange = guestUserConfig.userAccessRange;
        }
        if (guestUserConfig.signUpPolicyContent) {
            // storeGroup.signUpOption.signUpPolicyContent =
            temp.signUpPolicyContent = guestUserConfig.signUpPolicyContent;
        }
        storeGroup.signUpOption = temp;
    }
};
export default resolvers;
