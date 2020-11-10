import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    UpdateStoreResponse,
    UpdateStoreInput,
    StoreUpdateParamInput
} from "GraphType";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel, StoreCls } from "../../../models/Store/Store";
import { ERROR_CODES } from "../../../types/values";
import { ClientSession } from "mongoose";
import { ProductModel } from "../../../models/Product/Product";
import { saveFilesForCustomField } from "../CreateStore/SaveFileForCustomField";

const resolvers: Resolvers = {
    Mutation: {
        UpdateStore: defaultResolver(
            privateResolver(
                async (
                    { args: { param }, context: { req } },
                    stack
                ): Promise<UpdateStoreResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoUser } = req;
                        const {
                            storeId,
                            updateParam,
                            withProduct
                        } = param as UpdateStoreInput;
                        const store = await StoreModel.findById(storeId);
                        if (!store) {
                            throw new ApolloError(
                                "존재하지 않는 Store",
                                ERROR_CODES.UNEXIST_STORE
                            );
                        }
                        if (!store.userId.equals(cognitoUser._id)) {
                            stack.push(cognitoUser, store);
                            throw new ApolloError(
                                "Store 사용 권한이 없습니다.",
                                ERROR_CODES.ACCESS_DENY_STORE
                            );
                        }
                        for (const field in updateParam) {
                            const value = updateParam[field];
                            store[field] = value;
                        }
                        const customFields = updateParam.customFields;
                        if (customFields) {
                            store.customFields = await saveFilesForCustomField(
                                cognitoUser.sub,
                                customFields
                            );
                        }
                        await store.save({ session });
                        if (withProduct) {
                            stack.push({ withProduct });
                            const result = await productUpdate(
                                store,
                                updateParam,
                                session,
                                stack
                            );
                            stack.push({ result });
                        }
                        await session.commitTransaction();
                        session.endSession();
                        return {
                            ok: true,
                            error: null,
                            data: store as any
                        };
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};

const productUpdate = async (
    store: DocumentType<StoreCls>,
    updateParam: StoreUpdateParamInput,
    session: ClientSession,
    stack: any[]
) => {
    // businessHours
    // infos
    // intro
    // warning
    // customFields
    // bookingPolicy

    const products = await ProductModel.find({
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

    const result = await Promise.all(
        products.map(async p => await p.save({ session }))
    );

    return result;
};

export default resolvers;
