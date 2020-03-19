import { ObjectId } from "mongodb";
import { Response } from "../../../utils/Response";
import { SmsSenderAuthInfo } from "GraphType";
import { BaseSchemaFunc } from "../../../abs/BaseFuncInterface.interface";

export interface SmsSenderProps {
    keys: ObjectId[];
    name: string;
    phoneNumber: string;
    authInfo: SmsSenderAuthInfo;
}
export interface SmsSenderFuncs extends BaseSchemaFunc {
    submitDocumentaryEvidence(
        documentaryEvidence: string[]
    ): Promise<Response<void>>;
}
