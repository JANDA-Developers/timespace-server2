import { Err } from "../utils/Error";

export interface BaseSchemaFunc {
    validateFields(): Err[];
}
