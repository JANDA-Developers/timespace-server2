import { createSchemaOptions } from "../abs/BaseSchema";
import {
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../types/values";
import { BaseGroup } from "../abs/BaseGroup";
import { StoreCls, StoreModel } from "./Store";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.GROUP)))
export class StoreGroupCls extends BaseGroup<StoreCls> {
    static async findByCode(
        groupCode: string
    ): Promise<DocumentType<StoreGroupCls>> {
        const group = await StoreGroupModel.findOne({
            code: groupCode
        });
        if (!group) {
            throw new ApolloError(
                "존재하지 않는 Group",
                ERROR_CODES.UNEXIST_GROUP
            );
        }
        return group;
    }

    async getList(
        this: DocumentType<StoreGroupCls>
    ): Promise<Array<DocumentType<StoreCls>>> {
        return await StoreModel.find({
            _id: {
                $in: this.list
            }
        });
    }
}

export const StoreGroupModel = getModelForClass(StoreGroupCls);
