import { BaseSchema } from "../../abs/BaseSchema";
import { prop } from "@typegoose/typegoose";

enum ItemValidatorType {
    TIME_CAPACITY_BASE,
    TIME_BASE
}

export class ItemValidator extends BaseSchema {
    @prop()
    name: string;

    @prop()
    type: ItemValidatorType;
}
