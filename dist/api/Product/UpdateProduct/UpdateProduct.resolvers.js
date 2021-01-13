"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const Product_1 = require("../../../models/Product/Product");
const values_1 = require("../../../types/values");
const apollo_server_1 = require("apollo-server");
const s3Funcs_1 = require("../../../utils/s3Funcs");
const aws_sdk_1 = require("aws-sdk");
const User_1 = require("../../../models/User");
const resolvers = {
    Mutation: {
        UpdateProduct: resolverFuncWrapper_1.defaultResolver(resolverFuncWrapper_1.privateResolver(async ({ args: { param }, context: { req } }, stack) => {
            const session = await typegoose_1.mongoose.startSession();
            session.startTransaction();
            try {
                const { productCode, updateProductParamInput } = param;
                const { cognitoUser } = req;
                const user = await User_1.UserModel.findUser(cognitoUser);
                const product = await Product_1.ProductModel.findByCode(productCode);
                if (!product.userId.equals(user._id)) {
                    throw new apollo_server_1.ApolloError("Product 접근 권한이 없습니다.", values_1.ERROR_CODES.ACCESS_DENY_PRODUCT);
                }
                for (const fieldName in updateProductParamInput) {
                    const element = updateProductParamInput[fieldName];
                    if (element !== null &&
                        fieldName !== "addImages" &&
                        fieldName !== "deleteImages") {
                        product[fieldName] = element;
                    }
                }
                const { addImages, deleteImages } = updateProductParamInput;
                if (deleteImages) {
                    const s3 = new aws_sdk_1.S3();
                    const deleteResult = await s3
                        .deleteObjects({
                        Bucket: process.env.AWS_BUCKETNAME || "",
                        Delete: {
                            Objects: deleteImages.map((imgUrl) => {
                                return {
                                    Key: imgUrl.split((process.env
                                        .AWS_BUCKETNAME || "") +
                                        "/")[1]
                                };
                            })
                        }
                    })
                        .promise();
                    if (deleteResult.Errors) {
                        stack.push(deleteResult.Errors);
                    }
                    // _.pullAll(product.images, deleteImages);
                    // TODO: Images S3에서 삭제하기
                    product.images = product.images.filter(img => !deleteImages.includes(img));
                }
                if (addImages) {
                    for (const file of addImages) {
                        const syncedFile = await file;
                        // 해당 경로에 폴더 존재여부 확인 & 생성
                        const { url } = await s3Funcs_1.uploadFile(syncedFile, {
                            dir: cognitoUser.sub +
                                "/" +
                                (product.code || "")
                        });
                        product.images.push(url);
                    }
                }
                await product.save({
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
                return await utils_1.errorReturn(error, session);
            }
        }))
    }
};
exports.default = resolvers;
//# sourceMappingURL=UpdateProduct.resolvers.js.map