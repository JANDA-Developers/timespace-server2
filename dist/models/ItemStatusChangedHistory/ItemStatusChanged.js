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
exports.ItemStatusChangedHistoryModel = exports.ItemStatusChangedCls = void 0;
const BaseSchema_1 = require("../../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("../__collectionNames");
const mongodb_1 = require("mongodb");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../types/values");
let ItemStatusChangedCls = class ItemStatusChangedCls extends BaseSchema_1.BaseSchema {
    async applyItemWithThis(session) {
        // const item = await ItemModel.findById();
        throw new apollo_server_1.ApolloError("개발중", values_1.ERROR_CODES.UNDERDEVELOPMENT);
    }
};
ItemStatusChangedCls.findLastestOne = async (itemId) => {
    const itemStatus = await exports.ItemStatusChangedHistoryModel.findOne({
        itemId
    }).sort({ updatedAt: -1 });
    return itemStatus;
};
__decorate([
    typegoose_1.prop({ default: "ITEM" }),
    __metadata("design:type", String)
], ItemStatusChangedCls.prototype, "type", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ItemStatusChangedCls.prototype, "status", void 0);
__decorate([
    typegoose_1.prop({
        get: id => new mongodb_1.ObjectId(id),
        set: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemStatusChangedCls.prototype, "workerId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ItemStatusChangedCls.prototype, "comment", void 0);
__decorate([
    typegoose_1.prop({
        get: id => new mongodb_1.ObjectId(id),
        set: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemStatusChangedCls.prototype, "itemId", void 0);
ItemStatusChangedCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.ITEM_STATUS_CHANGE)))
], ItemStatusChangedCls);
exports.ItemStatusChangedCls = ItemStatusChangedCls;
exports.ItemStatusChangedHistoryModel = typegoose_1.getModelForClass(ItemStatusChangedCls);
//# sourceMappingURL=ItemStatusChanged.js.map