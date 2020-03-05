import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { UpdateProductResponse, UpdateProductInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product/Product";
import { ERROR_CODES } from "../../../types/values";
import { ApolloError } from "apollo-server";
import { uploadFile } from "../../../utils/s3Funcs";
import _ from "lodash";
import { S3 } from "aws-sdk";

const resolvers: Resolvers = {
    Mutation: {
        UpdateProduct: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<UpdateProductResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const {
                            productCode,
                            updateProductParamInput
                        } = param as UpdateProductInput;
                        const { cognitoUser } = req;
                        const product = await ProductModel.findByCode(
                            productCode
                        );
                        if (!product.userId.equals(cognitoUser._id)) {
                            throw new ApolloError(
                                "Product 접근 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_PRODUCT
                            );
                        }
                        for (const fieldName in updateProductParamInput) {
                            const element = updateProductParamInput[fieldName];
                            if (
                                element !== null &&
                                fieldName !== "addImages" &&
                                fieldName !== "deleteImages"
                            ) {
                                product[fieldName] = element;
                            }
                        }

                        const {
                            addImages,
                            deleteImages
                        } = updateProductParamInput;
                        stack.push({
                            deleteImages
                        });
                        if (deleteImages) {
                            const s3 = new S3();
                            const deleteResult = await s3
                                .deleteObjects({
                                    Bucket: process.env.AWS_BUCKETNAME || "",
                                    Delete: {
                                        Objects: deleteImages.map((imgUrl): {
                                            Key: string;
                                            Version?: string;
                                        } => {
                                            return {
                                                Key: imgUrl.split(
                                                    (process.env
                                                        .AWS_BUCKETNAME || "") +
                                                        "/"
                                                )[1]
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
                            product.images = product.images.filter(
                                img => !deleteImages.includes(img)
                            );
                        }
                        stack.push({ afterDeleteImage: product.images });
                        if (addImages) {
                            stack.push(addImages);
                            for (const file of addImages) {
                                const syncedFile = await file;
                                stack.push({ syncedFile });
                                stack.push({
                                    file: {
                                        name: file.filename,
                                        mimetype: file.mimetype
                                    }
                                });

                                /* 
                                    ? 파일 업로드 폴더 구조 설정하기
                                    * ${userId}/${houseId}/~~
                                */
                                // 해당 경로에 폴더 존재여부 확인 & 생성
                                const { url } = await uploadFile(syncedFile, {
                                    dir:
                                        cognitoUser.sub +
                                        "/" +
                                        (product.code || "")
                                });
                                product.images.push(url);
                            }
                        }
                        stack.push("after addImages..........................");
                        await product.save({
                            session
                        });
                        await session.commitTransaction();
                        session.endSession();
                        return {
                            ok: true,
                            error: null,
                            data: product as any
                        };
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};
export default resolvers;
