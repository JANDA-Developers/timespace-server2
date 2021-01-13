"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Store_1 = require("../../../models/Store/Store");
const values_1 = require("../../../types/values");
const Product_1 = require("../../../models/Product/Product");
const SaveFileForCustomField_1 = require("../CreateStore/SaveFileForCustomField");
const resolvers = {
    Mutation: {
        UpdateStore: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }, stack) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { cognitoUser } = req;
                const { storeId, updateParam, withProduct } = param;
                const store = await Store_1.StoreModel.findById(storeId);
                if (!store) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Store", values_1.ERROR_CODES.UNEXIST_STORE);
                }
                if (!store.userId.equals(cognitoUser._id)) {
                    stack.push(cognitoUser, store);
                    throw new apollo_server_1.ApolloError("Store 사용 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_STORE);
                }
                for (const field in updateParam) {
                    const value = updateParam[field];
                    store[field] = value;
                }
                const customFields = updateParam.customFields;
                if (customFields) {
                    store.customFields = await SaveFileForCustomField_1.saveFilesForCustomField(cognitoUser.sub, customFields);
                }
                await store.save({ session });
                if (withProduct) {
                    stack.push({ withProduct });
                    const result = await productUpdate(store, updateParam, session, stack);
                    stack.push({ result });
                }
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null,
                    data: store
                };
            }
            catch (error) {
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
const productUpdate = async (store, updateParam, session, stack) => {
    // businessHours
    // infos
    // intro
    // warning
    // customFields
    // bookingPolicy
    const products = await Product_1.ProductModel.find({
        storeId: store._id,
        isDeleted: {
            $ne: true
        }
    });
    products.forEach(product => {
        for (const key in updateParam) {
            if (key !== "name" && key !== "description") {
                const element = updateParam[key];
                stack.push({ key, element });
                if (element) {
                    product[key] = element;
                }
            }
        }
    });
    const result = await Promise.all(products.map(async (p) => await p.save({ session })));
    return result;
};
exports.default = resolvers;
//# sourceMappingURL=UpdateStore.resolvers.js.map