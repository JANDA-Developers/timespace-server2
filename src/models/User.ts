import {
    getModelForClass,
    modelOptions,
    prop,
    index,
    DocumentType
} from "@typegoose/typegoose";
import { getCollectionName, ModelName } from "./__collectionNames";
import { User } from "../types/graph";
import { ErrCls } from "./Err";

export type LoggedInInfo = {
    refreshToken: string;
    idToken: string;
    accessToken: string;
    expiryDate: number;
    ip: string;
    os: string;
};

@modelOptions({
    schemaOptions: {
        _id: false,
        collection: getCollectionName(ModelName.USER),
        timestamps: true
    }
})
@index(
    {
        sub: 1
    },
    { unique: true }
)
export class UserCls {
    static findBySub = async (sub: string): Promise<DocumentType<UserCls>> => {
        const user = await UserModel.findOne({
            _id: sub
        });
        if (!user) {
            throw ErrCls.makeErr("201", "존재하지 않는 UserId");
        }
        return user;
    };
    @prop({ index: true })
    sub: string;

    @prop()
    loginInfos: LoggedInInfo[];
}

export const migrateCognitoUser = (user: any): User => {
    return {
        _id: user.sub,
        tokenExpiry: user.exp,
        ...user
    };
};

export const UserModel = getModelForClass(UserCls);
