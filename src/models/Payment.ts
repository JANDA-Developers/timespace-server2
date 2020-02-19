import { BaseSchema, createSchemaOptions } from "../abs/BaseSchema";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { ModelName, getCollectionName } from "./__collectionNames";
import { ObjectId } from "mongodb";
import { CardInfo } from "GraphType";

@modelOptions(createSchemaOptions(getCollectionName(ModelName.PAYMETHOD)))
export class PayMethodCls extends BaseSchema {
    @prop()
    userId: ObjectId;

    @prop()
    cardInfo: CardInfo;
}

export const PaymentModel = getModelForClass(PayMethodCls);
