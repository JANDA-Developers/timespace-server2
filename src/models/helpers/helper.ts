import { StoreCls, StoreModel } from "../Store/Store";
import { DocumentType } from "@typegoose/typegoose";
import { StoreGroupCls, StoreGroupModel } from "../StoreGroup";
import {
    StoreUserSignUpOption,
    SignUpPermission,
    UserAccessRange
} from "../../types/graph";
import { StoreUserModel } from "../StoreUser";
import { ApolloError } from "apollo-server";

export const convertStoreGroupCode = async (
    sgcode: string
): Promise<DocumentType<StoreCls> | DocumentType<StoreGroupCls> | null> => {
    const result = await Promise.all([
        StoreModel.findOne({
            code: sgcode
        }),
        StoreGroupModel.findOne({
            code: sgcode
        })
    ]);
    if (result.filter(t => t).length !== 1) {
        return null;
    }
    if (result[0]) {
        return result[0];
    }
    if (result[1]) {
        return result[1];
    }
    return null;
};

export class SignUpOption {
    private acceptAnonymousUser: boolean;
    private signUpPermission: SignUpPermission;
    private userAccessRange: UserAccessRange;

    static builder() {
        return new SignUpOption();
    }

    private constructor() {}

    public setAcceptAnonymousUser(input: boolean): SignUpOption {
        this.acceptAnonymousUser = input;
        return this;
    }

    public setSingUpPermission(input: SignUpPermission): SignUpOption {
        this.signUpPermission = input;
        return this;
    }

    public setUserAccessRange(input: UserAccessRange): SignUpOption {
        this.userAccessRange = input;
        return this;
    }

    public build(): StoreUserSignUpOption {
        return {
            acceptAnonymousUser: this.acceptAnonymousUser,
            signUpPermission: this.signUpPermission,
            userAccessRange: this.userAccessRange
        };
    }
}

export const isExistingStoreUser = async (
    email: string,
    storeGroupCode: string
) => {
    // Email, StoreGroupCode가 같으면 중복임
    const existingUser = await StoreUserModel.findOne({
        email,
        storeGroupCode
    }).exec();
    if (existingUser) {
        throw new ApolloError("중복 가입");
    }
};
