import { BaseSchema } from "../../abs/BaseSchema";
import { prop } from "@typegoose/typegoose";

enum ProductValidatorType {
    TIME_CAPACITY_BASE,
    TIME_BASE
}

export class ProductValidator extends BaseSchema {
    @prop()
    name: string;

    @prop()
    type: ProductValidatorType;
}
