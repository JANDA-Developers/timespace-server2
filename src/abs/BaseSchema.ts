import { ObjectId } from "mongodb";
import { SchemaOptions } from "mongoose";
import { prop, index } from "@typegoose/typegoose";

@index(
    {
        expireAt: 1
    },
    {
        expireAfterSeconds: 0
    }
)
export class BaseSchema {
    @prop({ default: () => new ObjectId() })
    _id: ObjectId;

    @prop()
    createdAt: Date;

    @prop()
    updatedAt: Date;

    @prop()
    expireAt: Date;
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
