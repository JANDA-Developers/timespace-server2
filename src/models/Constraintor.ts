import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.CONSTRAINTOR)))
export class ConstraintorCls extends BaseSchema {
    @prop()
    name: string;
}

export const ConstraintorModel = getModelForClass(ConstraintorCls);
