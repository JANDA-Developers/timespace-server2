import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { ModelName, getCollectionName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { PayMethodInfo } from "GraphType";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.PAYMETHOD)))
export class PayMethodCls extends BaseSchema {
    @prop()
    userId: ObjectId;

    @prop()
    payInfo: PayMethodInfo;
}

export const PaymentModel = getModelForClass(PayMethodCls);
