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
exports.StoreGroupModel = exports.StoreGroupCls = void 0;
const BaseSchema_1 = require("../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("./__collectionNames");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../types/values");
const BaseGroup_1 = require("../abs/BaseGroup");
const Store_1 = require("./Store/Store");
const mongodb_1 = require("mongodb");
let StoreGroupCls = class StoreGroupCls extends BaseGroup_1.BaseGroup {
    static makeDefaultGroup(userId) {
        return new exports.StoreGroupModel({
            _id: new mongodb_1.ObjectId(),
            name: "defaultGroup",
            isDefault: true,
            userId,
            type: "STORE_GROUP",
            description: "기본 그룹"
        });
    }
    static async findByCode(groupCode) {
        const group = await exports.StoreGroupModel.findOne({
            code: groupCode,
            type: "STORE_GROUP"
        });
        if (!group) {
            throw new apollo_server_1.ApolloError("존재하지 않는 Group", values_1.ERROR_CODES.UNEXIST_GROUP);
        }
        return group;
    }
    async getList() {
        return await Store_1.StoreModel.find({
            _id: {
                $in: this.list
            },
            expiresAt: {
                $exists: false
            }
        });
    }
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Boolean)
], StoreGroupCls.prototype, "isDefault", void 0);
__decorate([
    typegoose_1.prop({
        default: {
            design: {
                color: values_1.DEFAULT_STORE_COLOR,
                logo: null,
                link: null
            }
        }
    }),
    __metadata("design:type", Object)
], StoreGroupCls.prototype, "config", void 0);
__decorate([
    typegoose_1.prop({
        default: {
            color: values_1.DEFAULT_STORE_COLOR,
            logo: null,
            link: null
        }
    }),
    __metadata("design:type", Object)
], StoreGroupCls.prototype, "designOption", void 0);
__decorate([
    typegoose_1.prop({
        default: {
            acceptAnonymousUser: false,
            userAccessRange: "STORE_GROUP",
            useSignUpAutoPermit: false,
            useEmailVerification: false,
            usePhoneVerification: true
        }
    }),
    __metadata("design:type", Object)
], StoreGroupCls.prototype, "signUpOption", void 0);
StoreGroupCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.GROUP)))
], StoreGroupCls);
exports.StoreGroupCls = StoreGroupCls;
exports.StoreGroupModel = typegoose_1.getModelForClass(StoreGroupCls);
//# sourceMappingURL=StoreGroup.js.map