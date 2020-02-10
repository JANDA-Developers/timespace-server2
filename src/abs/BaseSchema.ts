import { ObjectId } from "mongodb";
import { SchemaOptions } from "mongoose";
import { prop, index } from "@typegoose/typegoose";

@index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
)
export class BaseSchema {
    @prop({
        default: () => new ObjectId(),
        get: id => new ObjectId(id),
        set: id => new ObjectId(id)
    })
    _id: ObjectId;

    @prop()
    createdAt: Date;

    @prop()
    updatedAt: Date;

    @prop()
    expiresAt: Date;
}

export const createSchemaOptions = (
    collection: string
): {
    existingConnection?: any;
    existingMongoose?: any;
    schemaOptions?: SchemaOptions;
} => {
    return {
        schemaOptions: {
            timestamps: true,
            collection
        }
    };
};
