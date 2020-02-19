import { GroupType } from "GraphType";
import { ObjectId } from "mongodb";
import { BaseSchema } from "./BaseSchema";
import { prop, DocumentType } from "@typegoose/typegoose";
import { genCode } from "../models/utils/genId";

export abstract class BaseGroup<Model extends BaseSchema> extends BaseSchema {
    @prop({
        set: id => new ObjectId(id),
        get: id => new ObjectId(id),
        required: [true, "UserId 누락"]
    })
    userId: ObjectId;

    @prop()
    name: string;

    @prop({ required: [true, "그룹 타입이 지정되지 않았습니다."] })
    type: GroupType;

    @prop({
        default(this: DocumentType<Model>) {
            return genCode(this._id);
        }
    })
    code: string;

    @prop()
    description: string;

    @prop({ default: [] })
    tags: string[];

    @prop({
        default: [],
        get: (ids: any[]) => ids.map(id => new ObjectId(id)),
        set: (ids: any[]) => ids.map(id => new ObjectId(id)),
        _id: false
    })
    list: ObjectId[];

    abstract async getList(): Promise<Array<DocumentType<Model>>>;
}
