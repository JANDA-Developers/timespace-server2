import { createSchemaOptions } from "../abs/BaseSchema";
import {
    prop,
    getModelForClass,
    modelOptions,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { ProductModel, ProductCls } from "./Product/Product";
import { GroupType } from "GraphType";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../types/values";
import { BaseGroup } from "../abs/BaseGroup";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.GROUP)))
export class ProductGroupCls extends BaseGroup<ProductCls> {
    static async findByCode(
        groupCode: string
    ): Promise<DocumentType<ProductGroupCls>> {
        const group = await ProductGroupModel.findOne({
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

    @prop({ required: true })
    type: GroupType;

    // TODO: GenGroupCode ㄱㄱㄱ
    @prop()
    code: string;

    @prop({
        set: id => new ObjectId(id),
        get: id => new ObjectId(id),
        required: [true, "UserId 누락"]
    })
    userId: ObjectId;

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id))
    })
    list: ObjectId[];

    @prop({ default: [] })
    tags: string[];

    @prop()
    description: string;

    async getList(
        this: DocumentType<ProductGroupCls>
    ): Promise<Array<DocumentType<ProductCls>>> {
        return await ProductModel.find({
            _id: {
                $in: this.list
            }
        });
    }
}

export const ProductGroupModel = getModelForClass(ProductGroupCls);
