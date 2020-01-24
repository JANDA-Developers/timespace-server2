import { ObjectId } from "mongodb";
import { SchemaOptions } from "mongoose";
import { prop } from "@typegoose/typegoose";

export class BaseSchema {
    @prop()
    _id: ObjectId;

    @prop()
    timezone: string;

    @prop()
    createdAt: Date;

    @prop()
    updatedAt: Date;
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
