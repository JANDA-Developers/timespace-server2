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
exports.ProductGroupModel = exports.ProductGroupCls = void 0;
const BaseSchema_1 = require("../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("./__collectionNames");
const mongodb_1 = require("mongodb");
const Product_1 = require("./Product/Product");
const apollo_server_1 = require("apollo-server");
const values_1 = require("../types/values");
const BaseGroup_1 = require("../abs/BaseGroup");
let ProductGroupCls = class ProductGroupCls extends BaseGroup_1.BaseGroup {
    static async findByCode(groupCode) {
        const group = await exports.ProductGroupModel.findOne({
            code: groupCode,
            type: "PRODUCT_GROUP"
        });
        if (!group) {
            throw new apollo_server_1.ApolloError("존재하지 않는 Group", values_1.ERROR_CODES.UNEXIST_GROUP);
        }
        return group;
    }
    async getList() {
        return await Product_1.ProductModel.find({
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
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], ProductGroupCls.prototype, "type", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ProductGroupCls.prototype, "code", void 0);
__decorate([
    typegoose_1.prop({
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id),
        required: [true, "UserId 누락"]
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ProductGroupCls.prototype, "userId", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        get: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        set: (ids) => ids.map(id => new mongodb_1.ObjectId(id))
    }),
    __metadata("design:type", Array)
], ProductGroupCls.prototype, "list", void 0);
__decorate([
    typegoose_1.prop({ default: [] }),
    __metadata("design:type", Array)
], ProductGroupCls.prototype, "tags", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ProductGroupCls.prototype, "description", void 0);
ProductGroupCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.GROUP)))
], ProductGroupCls);
exports.ProductGroupCls = ProductGroupCls;
exports.ProductGroupModel = typegoose_1.getModelForClass(ProductGroupCls);
//# sourceMappingURL=ProductGroupCls.js.map