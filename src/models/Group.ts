import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.GROUP)))
export class GroupCls extends BaseSchema {
    @prop()
    name: string;
}

export const GroupModel = getModelForClass(GroupCls);
