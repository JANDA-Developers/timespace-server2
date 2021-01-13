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
exports.ItemModel = exports.ItemCls = void 0;
const BaseSchema_1 = require("../../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("../__collectionNames");
const mongodb_1 = require("mongodb");
const genId_1 = require("../utils/genId");
const Product_1 = require("../Product/Product");
const DateTimeRange_1 = require("../../utils/DateTimeRange");
const ItemStatusChanged_1 = require("../ItemStatusChangedHistory/ItemStatusChanged");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../../types/values");
let ItemCls = class ItemCls extends BaseSchema_1.BaseSchema {
    static async findByCode(itemCode) {
        const item = await exports.ItemModel.findOne({
            code: itemCode
        });
        if (!item) {
            throw new apollo_server_1.ApolloError("존재하지 않는 itemCode입니다", values_1.ERROR_CODES.UNEXIST_ITEM);
        }
        return item;
    }
    async setCode(productCode, date = new Date()) {
        await Product_1.ProductModel.findByCode(productCode);
        this.code = genId_1.genItemCode(productCode, date);
    }
    // 처음 예약시에 status set! => product.needToConfirm 설정값에 따라서 달라짐
    async setStatusForDefault() {
        const product = await Product_1.ProductModel.findById(this.productId);
        if (!product) {
            throw new Error("Product is undefined in ItemCls");
        }
        const needToConfirm = product.needToConfirm;
        if (needToConfirm) {
            this.status = "PENDING";
        }
        else {
            this.status = "PERMITTED";
        }
    }
    applyStatus(status, options = {}) {
        if (this.status === status && this.status !== "PENDING") {
            throw new apollo_server_1.ApolloError(`이미 ${this.status} 상태 입니다.`, status === "PERMITTED"
                ? values_1.ERROR_CODES.ALREADY_PERMITTED_ITEM
                : values_1.ERROR_CODES.ALREADY_CANCELED_ITEM, {
                loc: "Item.applyStatus",
                data: {
                    currentItemStatus: this.status,
                    yourInput: status
                }
            });
        }
        if (this.status === "CANCELED" && status === "PERMITTED") {
            throw new apollo_server_1.ApolloError("CANCELED 상태의 아이템은 PERMITTED 상태로 변경할 수 없습니다", values_1.ERROR_CODES.IMPOSIBLE_CHANGE_ITEM_STATUS, {
                loc: "Item.applyStatus",
                data: {
                    currentItemStatus: this.status,
                    yourInput: status
                }
            });
        }
        this.status = status;
        const itemStatusChangedHistory = new ItemStatusChanged_1.ItemStatusChangedHistoryModel({
            workerId: options.workerId && this.buyerId,
            comment: options.comment || "",
            type: "ITEM",
            status,
            itemId: this._id
        });
        const tempArr = [
            itemStatusChangedHistory._id,
            ...this.statusChangedHistory
        ];
        this.statusChangedHistory = tempArr;
        console.log(this);
        return itemStatusChangedHistory;
    }
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ItemCls.prototype, "name", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], ItemCls.prototype, "code", void 0);
__decorate([
    typegoose_1.prop({
        required: true,
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemCls.prototype, "storeId", void 0);
__decorate([
    typegoose_1.prop({
        required: true,
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemCls.prototype, "productId", void 0);
__decorate([
    typegoose_1.prop({
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemCls.prototype, "buyerId", void 0);
__decorate([
    typegoose_1.prop({
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemCls.prototype, "userId", void 0);
__decorate([
    typegoose_1.prop({
        set: v => v,
        get: v => {
            return new DateTimeRange_1.DateTimeRangeCls(v);
        }
    }),
    __metadata("design:type", Object)
], ItemCls.prototype, "dateTimeRange", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ItemCls.prototype, "memo", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemCls.prototype, "transactionId", void 0);
__decorate([
    typegoose_1.prop({ default: () => false }),
    __metadata("design:type", Boolean)
], ItemCls.prototype, "isExtend", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        set(cf) {
            return cf.map(c => {
                const key = new mongodb_1.ObjectId(c.key);
                return {
                    key,
                    type: c.type,
                    label: c.label || "",
                    value: c.value
                };
            });
        },
        get(cf) {
            return cf.map(c => {
                return {
                    key: new mongodb_1.ObjectId(c.key),
                    type: c.type,
                    label: c.label || "",
                    value: c.value
                };
            });
        }
    }),
    __metadata("design:type", Array)
], ItemCls.prototype, "customFieldValues", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ItemCls.prototype, "phoneNumber", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", mongodb_1.ObjectId)
], ItemCls.prototype, "storeUserId", void 0);
__decorate([
    typegoose_1.prop({ default: "PENDING" }),
    __metadata("design:type", String)
], ItemCls.prototype, "status", void 0);
__decorate([
    typegoose_1.prop({
        default: () => [],
        get: ids => ids.map((id) => new mongodb_1.ObjectId(id)),
        set: ids => ids.map((id) => new mongodb_1.ObjectId(id))
    }),
    __metadata("design:type", Array)
], ItemCls.prototype, "statusChangedHistory", void 0);
__decorate([
    typegoose_1.prop({ default: () => 1 }),
    __metadata("design:type", Number)
], ItemCls.prototype, "orderCount", void 0);
ItemCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.ITEM)))
], ItemCls);
exports.ItemCls = ItemCls;
exports.ItemModel = typegoose_1.getModelForClass(ItemCls);
//# sourceMappingURL=Item.js.map