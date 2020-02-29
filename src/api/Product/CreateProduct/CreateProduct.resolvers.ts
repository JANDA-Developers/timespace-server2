import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import { CreateProductResponse, CreateProductInput } from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { ProductModel } from "../../../models/Product/Product";
import { ObjectId } from "mongodb";
import { StoreModel } from "../../../models/Store/Store";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { uploadFile } from "../../../utils/s3Funcs";
import { PeriodWithDays } from "../../../utils/PeriodWithDays";
import { daysToNumber } from "../../../utils/periodFuncs";

const resolvers: Resolvers = {
    Mutation: {
        CreateProduct: defaultResolver(
            privateResolver(
                async ({
                    args: { param },
                    context: { req }
                }): Promise<CreateProductResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const {
                            description,
                            name,
                            storeId,
                            intro,
                            warning,
                            optionalParams,
                            images,
                            infos
                        } = param as CreateProductInput;
                        const { cognitoUser } = req;

                        const productId = new ObjectId();
                        const store = await StoreModel.findById(storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }
                        const product = new ProductModel({
                            _id: productId,
                            name,
                            userId: cognitoUser._id,
                            storeId: store._id,
                            description,
                            intro: intro || undefined,
                            warning: warning || undefined,
                            infos: infos
                        });

                        // TODO: Store의 기본값을 미리 상속받고 간다.
                        product.usingPeriodOption = store.usingPeriodOption;
                        product.usingCapacityOption = store.usingCapacityOption;
                        if (store.businessHours && store.periodOption) {
                            product.periodOption = store.periodOption;
                            product.businessHours = store.businessHours;
                        }
                        if (optionalParams) {
                            if (
                                optionalParams.periodOption &&
                                optionalParams.businessHours
                            ) {
                                const periodOption =
                                    optionalParams.periodOption;
                                product.periodOption = {
                                    ...periodOption,
                                    offset: periodOption.offset || 0
                                };
                                const businessHours =
                                    optionalParams.businessHours.length !== 0
                                        ? optionalParams.businessHours.map(
                                              (v): PeriodWithDays =>
                                                  new PeriodWithDays({
                                                      start: v.start,
                                                      end: v.end,
                                                      days: daysToNumber(
                                                          v.days as any
                                                      ),
                                                      offset:
                                                          periodOption.offset ||
                                                          0
                                                  })
                                          )
                                        : store.businessHours;
                                product.businessHours = businessHours;
                            }
                            for (const fieldName in optionalParams) {
                                const param = optionalParams[fieldName];
                                if (param) {
                                    product[fieldName] = param;
                                }
                            }
                        }

                        if (images) {
                            for (const file of images) {
                                const syncedFile = await file;
                                console.log({ syncedFile });
                                // TODO: 파일 업로드 구현 ㄱㄱ

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
                        // TODO: Image Upload to S3, after that, save result in product

                        // TODO: Compare BusinessHours between "Store" and "ProductInput"
                        await product.save({ session });

                        await StoreModel.updateOne(
                            {
                                _id: store._id
                            },
                            {
                                $push: {
                                    products: productId
                                }
                            },
                            {
                                session
                            }
                        );

                        await session.commitTransaction();
                        session.endSession();
                        return {
                            ok: true,
                            error: null,
                            data: product as any
                        };
                    } catch (error) {
                        console.log(error);
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};
export default resolvers;
