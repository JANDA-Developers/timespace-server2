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
exports.NotificationModel = exports.NotificationCls = void 0;
const BaseSchema_1 = require("../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("./__collectionNames");
const mongodb_1 = require("mongodb");
let NotificationCls = class NotificationCls extends BaseSchema_1.BaseSchema {
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], NotificationCls.prototype, "userId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], NotificationCls.prototype, "storeId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], NotificationCls.prototype, "name", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], NotificationCls.prototype, "description", void 0);
__decorate([
    typegoose_1.prop({ default: () => true }),
    __metadata("design:type", Boolean)
], NotificationCls.prototype, "isNew", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], NotificationCls.prototype, "url", void 0);
NotificationCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.NOTIFICATION)))
], NotificationCls);
exports.NotificationCls = NotificationCls;
exports.NotificationModel = typegoose_1.getModelForClass(NotificationCls);
//# sourceMappingURL=Notification.js.map