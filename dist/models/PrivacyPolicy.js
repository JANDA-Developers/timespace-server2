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
exports.PrivacyPolicyModel = exports.PrivacyPolicyCls = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const BaseSchema_1 = require("../abs/BaseSchema");
const __collectionNames_1 = require("./__collectionNames");
let PrivacyPolicyCls = class PrivacyPolicyCls extends BaseSchema_1.BaseSchema {
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], PrivacyPolicyCls.prototype, "name", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], PrivacyPolicyCls.prototype, "content", void 0);
PrivacyPolicyCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.PRIVACY_POLICY)))
], PrivacyPolicyCls);
exports.PrivacyPolicyCls = PrivacyPolicyCls;
exports.PrivacyPolicyModel = typegoose_1.getModelForClass(PrivacyPolicyCls);
//# sourceMappingURL=PrivacyPolicy.js.map