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
exports.TransactionModel = exports.TransactionCls = void 0;
const BaseSchema_1 = require("../../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("../__collectionNames");
const mongodb_1 = require("mongodb");
let TransactionCls = class TransactionCls extends BaseSchema_1.BaseSchema {
};
__decorate([
    typegoose_1.prop({
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], TransactionCls.prototype, "sellerId", void 0);
__decorate([
    typegoose_1.prop({
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], TransactionCls.prototype, "storeId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], TransactionCls.prototype, "itemId", void 0);
__decorate([
    typegoose_1.prop({
        required: true,
        default: {
            origin: 0,
            paid: 0,
            refunded: 0
        }
    }),
    __metadata("design:type", Object)
], TransactionCls.prototype, "amountInfo", void 0);
__decorate([
    typegoose_1.prop({
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], TransactionCls.prototype, "storeUserId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], TransactionCls.prototype, "paymethod", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Number)
], TransactionCls.prototype, "count", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], TransactionCls.prototype, "currency", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Array)
], TransactionCls.prototype, "history", void 0);
__decorate([
    typegoose_1.prop({ default: () => "NONE" }),
    __metadata("design:type", String)
], TransactionCls.prototype, "paymentStatus", void 0);
__decorate([
    typegoose_1.prop({ default: () => "NONE" }),
    __metadata("design:type", String)
], TransactionCls.prototype, "refundStatus", void 0);
TransactionCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.TRANSACTION)))
], TransactionCls);
exports.TransactionCls = TransactionCls;
exports.TransactionModel = typegoose_1.getModelForClass(TransactionCls);
//# sourceMappingURL=Transaction.js.map