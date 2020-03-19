import { ObjectId } from "mongodb";
import { BaseSchemaFunc } from "../../../abs/BaseFuncInterface.interface";
import { SmsSendTarget } from "GraphType";

export interface SmsTriggerProps {
    key: ObjectId;
    formatId: ObjectId;
    senderId?: ObjectId;
    event: string;
    isEnable: boolean;
    sendTarget: SmsSendTarget;
}

export interface SmsTriggerFuncs extends BaseSchemaFunc {}
