"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Product_1 = require("../../../models/Product/Product");
const mongodb_1 = require("mongodb");
const Store_1 = require("../../../models/Store/Store");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../../types/values");
const s3Funcs_1 = require("../../../utils/s3Funcs");
const PeriodWithDays_1 = require("../../../utils/PeriodWithDays");
const periodFuncs_1 = require("../../../utils/periodFuncs");
const genId_1 = require("../../../models/utils/genId");
const resolvers = {
    Mutation: {
        CreateProduct: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }, stack) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { description, name, storeId, intro, warning, optionalParams, images, infos, subTitle } = param;
                const { cognitoUser } = req;
                const productId = new mongodb_1.ObjectId();
                const store = await Store_1.StoreModel.findById(storeId);
                if (!store) {
                    throw new apollo_server_1.ApolloError("존재하지 않는 Store", values_1.ERROR_CODES.UNEXIST_STORE);
                }
                const product = new Product_1.ProductModel({
                    _id: productId,
                    name,
                    subTitle: subTitle || undefined,
                    userId: cognitoUser._id,
                    storeId: store._id,
                    description,
                    intro: intro || undefined,
                    warning: warning || undefined,
                    infos,
                    usingPayment: store.usingPayment
                });
                if (store.businessHours && store.periodOption) {
                    product.periodOption = store.periodOption;
                    product.businessHours = store.businessHours;
                }
                if (optionalParams) {
                    if (optionalParams.periodOption &&
                        optionalParams.businessHours) {
                        const periodOption = optionalParams.periodOption;
                        product.periodOption = {
                            ...periodOption,
                            offset: periodOption.offset || 0
                        };
                        const businessHours = optionalParams.businessHours.length !== 0
                            ? optionalParams.businessHours.map((v) => new PeriodWithDays_1.PeriodWithDays({
                                start: v.start,
                                end: v.end,
                                days: periodFuncs_1.daysToNumber(v.days),
                                offset: periodOption.offset ||
                                    0
                            }))
                            : store.businessHours;
                        product.businessHours = businessHours;
                    }
                    for (const fieldName in optionalParams) {
                        const param = optionalParams[fieldName];
                        if (param) {
                            product[fieldName] = param;
                        }
                    }
                    if (!product.bookingPolicy) {
                        product.bookingPolicy = store.bookingPolicy;
                    }
                }
                if (images) {
                    for (const file of images) {
                        const syncedFile = await file;
                        /*
                            ? 파일 업로드 폴더 구조 설정하기
                            * ${userId}/${houseId}/~~

                        */
                        // 해당 경로에 폴더 존재여부 확인 & 생성
                        const { url } = await s3Funcs_1.uploadFile(syncedFile, {
                            dir: cognitoUser.sub +
                                `/${genId_1.s4()}${genId_1.s4()}/` +
                                (product.code || "")
                        });
                        product.images.push(url);
                    }
                }
                await product.save({ session });
                await Store_1.StoreModel.updateOne({
                    _id: store._id
                }, {
                    $push: {
                        products: productId
                    }
                }, {
                    session
                });
                await session.commitTransaction();
                session.endSession();
                return {
                    ok: true,
                    error: null,
                    data: product
                };
            }
            catch (error) {
                console.log(error);
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=CreateProduct.resolvers.js.map