"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreUserModel = exports.StoreUserCls = void 0;
const bcryptjs_1 = require("bcryptjs");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("../__collectionNames");
const BaseSchema_1 = require("../../abs/BaseSchema");
const mongodb_1 = require("mongodb");
const utils_1 = require("../../utils/utils");
const BCRYPT_ROUNDS = 10;
let StoreUserCls = class StoreUserCls extends BaseSchema_1.BaseSchema {
    // 전화번호 변경시에도 이 함수 사용.
    setPhoneNumber(phoneNumner) {
        if (phoneNumner !== this.phoneNumber) {
            this.phoneNumber = phoneNumner;
            this.verifiedPhoneNumber = false;
        }
        return this;
    }
    // email "변경"시에도 사용함.
    setEmail(email) {
        if (email !== this.email) {
            this.email = email;
            this.verifiedEmail = false;
        }
        return this;
    }
    async setZoneinfo(timezone) {
        try {
            const zoneinfo = await utils_1.getCountryInfo(timezone);
            this.zoneinfo = zoneinfo;
            return this;
        }
        catch (error) {
            return this;
        }
    }
    setStoreCode(store) {
        this.storeId = store._id;
        this.storeCode = store.code;
        return this;
    }
    setStoreGroupCode(storeGroup) {
        this.storeGroupId = storeGroup._id;
        this.storeGroupCode = storeGroup.code;
        return this;
    }
    async comparePassword(password) {
        if (this.password) {
            return await bcryptjs_1.compare(password, this.password || "");
        }
        else {
            throw new Error("Password is not exist!");
        }
    }
    async hashPassword() {
        if (this.password) {
            this.password = await bcryptjs_1.hash(this.password, BCRYPT_ROUNDS);
        }
    }
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "name", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "password", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "email", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Object)
], StoreUserCls.prototype, "zoneinfo", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "phoneNumber", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], StoreUserCls.prototype, "storeId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "storeCode", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], StoreUserCls.prototype, "storeGroupCode", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", mongodb_1.ObjectId)
], StoreUserCls.prototype, "storeGroupId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "groupCode", void 0);
__decorate([
    typegoose_1.prop({ required: true, default: () => false }),
    __metadata("design:type", Boolean)
], StoreUserCls.prototype, "verifiedPhoneNumber", void 0);
__decorate([
    typegoose_1.prop({ required: true, defualt: () => false }),
    __metadata("design:type", Boolean)
], StoreUserCls.prototype, "verifiedEmail", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "phoneVerificationCode", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "emailVerificationCode", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], StoreUserCls.prototype, "passwordChangeVerificationId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "buyerSub", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreUserCls.prototype, "company", void 0);
StoreUserCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.STORE_USER)))
], StoreUserCls);
exports.StoreUserCls = StoreUserCls;
exports.StoreUserModel = typegoose_1.getModelForClass(StoreUserCls);
//# sourceMappingURL=StoreUser.js.map