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
exports.Policy = exports.StoreModel = exports.StoreCls = void 0;
const BaseSchema_1 = require("../../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("../__collectionNames");
const mongodb_1 = require("mongodb");
const apollo_server_1 = require("apollo-server");
const genId_1 = require("../utils/genId");
const values_1 = require("../../types/values");
const periodFuncs_1 = require("../../utils/periodFuncs");
const propOptions_1 = require("../_propValidateOptions/propOptions");
let StoreCls = class StoreCls extends BaseSchema_1.BaseSchema {
};
StoreCls.findByCode = async (storeCode) => {
    const store = await exports.StoreModel.findOne({
        code: storeCode
    });
    if (!store) {
        throw new apollo_server_1.ApolloError("존재하지 않는 StoreCode입니다", values_1.ERROR_CODES.UNEXIST_STORE);
    }
    if (store.expiresAt) {
        throw new apollo_server_1.ApolloError("존재하지 않는 Store 입니다.(삭제됨)", values_1.ERROR_CODES.UNEXIST_STORE);
    }
    return store;
};
__decorate([
    typegoose_1.prop(propOptions_1.propOptIdOption({
        required: true,
        validate: {
            validator: user => user,
            message: "Store.user 정보가 존재하지 않습니다."
        }
    })),
    __metadata("design:type", mongodb_1.ObjectId)
], StoreCls.prototype, "userId", void 0);
__decorate([
    typegoose_1.prop({
        required: true,
        set: (zoneinfo) => {
            if (typeof zoneinfo === "string") {
                return JSON.parse(zoneinfo);
            }
            return zoneinfo;
        },
        get: (zoneinfo) => zoneinfo
    }),
    __metadata("design:type", Object)
], StoreCls.prototype, "zoneinfo", void 0);
__decorate([
    typegoose_1.prop({
        required: true,
        validate: {
            validator: name => name,
            message: "상점 이름이 존재하지 않습니다."
        }
    }),
    __metadata("design:type", String)
], StoreCls.prototype, "name", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreCls.prototype, "type", void 0);
__decorate([
    typegoose_1.prop({
        default() {
            return genId_1.genCode(this._id);
        }
    }),
    __metadata("design:type", String)
], StoreCls.prototype, "code", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreCls.prototype, "image", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreCls.prototype, "description", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        get: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        set: (ids) => {
            return ids.map(id => typeof id === "string" ? new mongodb_1.ObjectId(id) : id);
        }
    }),
    __metadata("design:type", Array)
], StoreCls.prototype, "products", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Object)
], StoreCls.prototype, "manager", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Object)
], StoreCls.prototype, "location", void 0);
__decorate([
    typegoose_1.prop({
        get(periodArr) {
            return periodFuncs_1.getPeriodFromDB(periodArr, this.periodOption.offset);
        },
        set(periodArr) {
            try {
                return periodFuncs_1.setPeriodToDB(periodArr, this.periodOption.offset);
            }
            catch (error) {
                return [];
            }
        },
        validate: [
            {
                validator(businessHours) {
                    console.log("In Validator");
                    console.log(businessHours);
                    return periodFuncs_1.validatePeriod(businessHours);
                },
                message: "Validation Fail"
            },
            {
                validator(businessHours) {
                    const unit = this.periodOption.unit;
                    return (businessHours.filter(({ time }) => time % unit !== 0)
                        .length === 0);
                },
                message: "BusinessHours.time 값이 unit의 배수가 아닙니다."
            },
            {
                validator(businessHours) {
                    return (businessHours.filter(({ start, end }) => start >= end)
                        .length === 0);
                },
                message: "end값이 start보다 작거나 같습니다."
            }
        ],
        default: []
    }),
    __metadata("design:type", Array)
], StoreCls.prototype, "businessHours", void 0);
__decorate([
    typegoose_1.prop(propOptions_1.propOptPeriodOption()),
    __metadata("design:type", Object)
], StoreCls.prototype, "periodOption", void 0);
__decorate([
    typegoose_1.prop(propOptions_1.propOptIdsOption({ defualt: [] })),
    __metadata("design:type", Array)
], StoreCls.prototype, "groupIds", void 0);
__decorate([
    typegoose_1.prop({
        get: (id) => new mongodb_1.ObjectId(id),
        set: (id) => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], StoreCls.prototype, "groupId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreCls.prototype, "warning", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], StoreCls.prototype, "intro", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        set(cf) {
            return cf.map(c => {
                return {
                    key: new mongodb_1.ObjectId(c.key || undefined),
                    ...c,
                    isMandatory: c.isMandatory || false
                };
            });
        },
        get(cf) {
            return cf.map(cf1 => {
                return {
                    ...cf1,
                    key: new mongodb_1.ObjectId(cf1.key),
                    isMandatory: cf1.isMandatory || false
                };
            });
        },
        validate: [
            {
                validator(value) {
                    console.log({
                        value
                    });
                    let result = true;
                    value.forEach(v => {
                        if (v.type === "LIST" && v.list.length === 0) {
                            result = false;
                        }
                    });
                    return result;
                },
                message: "CustomField Validation Error => type=List but List is empty"
            }
        ]
    }),
    __metadata("design:type", Array)
], StoreCls.prototype, "customFields", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Boolean)
], StoreCls.prototype, "usingPayment", void 0);
__decorate([
    typegoose_1.prop({
        default: () => {
            return {
                limitFirstBooking: 0,
                limitLastBooking: 60
            };
        }
    }),
    __metadata("design:type", Object)
], StoreCls.prototype, "bookingPolicy", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Array)
], StoreCls.prototype, "polices", void 0);
__decorate([
    typegoose_1.prop({
        default: []
    }),
    __metadata("design:type", Array)
], StoreCls.prototype, "infos", void 0);
__decorate([
    typegoose_1.prop({
        default: []
    }),
    __metadata("design:type", Array)
], StoreCls.prototype, "blockDates", void 0);
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
], StoreCls.prototype, "signUpOption", void 0);
StoreCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.STORE)))
], StoreCls);
exports.StoreCls = StoreCls;
exports.StoreModel = typegoose_1.getModelForClass(StoreCls);
class Policy {
}
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], Policy.prototype, "name", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], Policy.prototype, "content", void 0);
__decorate([
    typegoose_1.prop({ default: false }),
    __metadata("design:type", Boolean)
], Policy.prototype, "require", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Number)
], Policy.prototype, "version", void 0);
exports.Policy = Policy;
//# sourceMappingURL=Store.js.map