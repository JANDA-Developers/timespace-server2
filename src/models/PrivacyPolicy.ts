import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { getCollectionName, ModelName } from "./__collectionNames";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.PRIVACY_POLICY)))
export class PrivacyPolicyCls extends BaseSchema {
    @prop()
    name: string;

    @prop()
    content: string;
}

export const PrivacyPolicyModel = getModelForClass(PrivacyPolicyCls);
