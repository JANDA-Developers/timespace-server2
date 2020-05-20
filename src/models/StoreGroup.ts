import { createSchemaOptions } from "../abs/BaseSchema";
import {
    getModelForClass,
    modelOptions,
    DocumentType,
    prop
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../types/values";
import { BaseGroup } from "../abs/BaseGroup";
import { StoreCls, StoreModel } from "./Store/Store";
import { ObjectId } from "mongodb";
import { StoreGroupConfig } from "GraphType";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.GROUP)))
export class StoreGroupCls extends BaseGroup<StoreCls> {
    static makeDefaultGroup(userId: ObjectId | string) {
        return new StoreGroupModel({
            _id: new ObjectId(),
            name: "defaultGroup",
            isDefault: true,
            userId,
            type: "STORE_GROUP",
            description: "기본 그룹"
        });
    }

    static async findByCode(
        groupCode: string
    ): Promise<DocumentType<StoreGroupCls>> {
        const group = await StoreGroupModel.findOne({
            code: groupCode,
            type: "STORE_GROUP"
        });
        if (!group) {
            throw new ApolloError(
                "존재하지 않는 Group",
                ERROR_CODES.UNEXIST_GROUP
            );
        }
        console.log(group);
        return group;
    }

    async getList(
        this: DocumentType<StoreGroupCls>
    ): Promise<Array<DocumentType<StoreCls>>> {
        return await StoreModel.find({
            _id: {
                $in: this.list
            },
            expiresAt: {
                $exists: false
            }
        });
    }

    @prop()
    isDefault: boolean;

    @prop({
        default: {
            design: {
                color: "#32297d",
                logo: null
            }
        } as StoreGroupConfig
    })
    config: StoreGroupConfig;
}

export const StoreGroupModel = getModelForClass(StoreGroupCls);
