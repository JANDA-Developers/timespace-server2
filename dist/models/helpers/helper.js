"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExistingStoreUser = exports.SignUpOption = exports.convertStoreGroupCode = void 0;
const Store_1 = require("../Store/Store");
const StoreGroup_1 = require("../StoreGroup");
const StoreUser_1 = require("../StoreUser/StoreUser");
const apollo_server_1 = require("apollo-server");
exports.convertStoreGroupCode = async (sgcode) => {
    const result = await Promise.all([
        Store_1.StoreModel.findOne({
            code: sgcode
        }),
        StoreGroup_1.StoreGroupModel.findOne({
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
class SignUpOption {
    constructor() { }
    static builder() {
        return new SignUpOption();
    }
    setAcceptAnonymousUser(input) {
        this.acceptAnonymousUser = input;
        return this;
    }
    setUserAccessRange(input) {
        this.userAccessRange = input;
        return this;
    }
    build() {
        return {
            acceptAnonymousUser: this.acceptAnonymousUser,
            userAccessRange: this.userAccessRange,
            useEmailVerification: this.useEmailVerification,
            usePhoneVerification: this.usePhoneVerification,
            useSignUpAutoPermit: this.useSignUpAutoPermit,
            signUpPolicyContent: this.signUpPolicyContent
        };
    }
}
exports.SignUpOption = SignUpOption;
exports.isExistingStoreUser = async (email, storeGroupCode) => {
    // Email, StoreGroupCode가 같으면 중복임
    const existingUser = await StoreUser_1.StoreUserModel.findOne({
        email,
        storeGroupCode
    }).exec();
    if (existingUser) {
        throw new apollo_server_1.ApolloError("중복 가입");
    }
};
//# sourceMappingURL=helper.js.map