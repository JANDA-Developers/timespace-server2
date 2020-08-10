import { BaseSchema, createSchemaOptions } from "../../abs/BaseSchema";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { VerificationTarget } from "../../types/graph";
import { getCollectionName, ModelName } from "../__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.VERIFICATION)))
export class VerificationCls extends BaseSchema {
    @prop()
    payload: string;

    @prop()
    target: VerificationTarget;

    @prop()
    isVerified: boolean;

    @prop()
    code: string;

    @prop()
    storeGroupCode?: string;
}

export const VerificationModel = getModelForClass(VerificationCls);
