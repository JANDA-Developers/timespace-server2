"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const StoreGroup_1 = require("../../../models/StoreGroup");
const values_1 = require("../../../types/values");
const apollo_server_1 = require("apollo-server");
const s3Funcs_1 = require("../../../utils/s3Funcs");
const resolvers = {
    Mutation: {
        UpdateStoreGroup: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param, groupCode }, context: { req } }) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const storeGroup = await StoreGroup_1.StoreGroupModel.findByCode(groupCode);
                if (!storeGroup.userId.equals(cognitoUser._id)) {
                    throw new apollo_server_1.ApolloError("해당 StoreGroup에 대한 접근권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_STORE_GROUP);
                }
                await setParamsToStoreGroupObject(storeGroup, param, cognitoUser);
                await storeGroup.save({ session });
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null,
                    data: storeGroup
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
const setParamsToStoreGroupObject = async (storeGroup, { description, designConfig, name, guestUserConfig }, user) => {
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
            const { url } = await s3Funcs_1.uploadFile(syncedLogo, {
                dir: `${user.sub}/storegroup/${storeGroup.code}/design/logos/`
            });
            storeGroup.designOption.logo = storeGroup.config.design.logo = url;
        }
        if (iconLogo) {
            const syncedLogo = await iconLogo;
            const { url } = await s3Funcs_1.uploadFile(syncedLogo, {
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
        const tempDesignConfig = {
            color: storeGroup.config.design.color || designConfig.color,
            iconLogo: storeGroup.config.design.iconLogo || designConfig.iconLogo,
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
exports.default = resolvers;
//# sourceMappingURL=UpdateStoreGroup.resolvers.js.map