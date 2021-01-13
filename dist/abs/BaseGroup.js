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
exports.BaseGroup = void 0;
const mongodb_1 = require("mongodb");
const BaseSchema_1 = require("./BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const genId_1 = require("../models/utils/genId");
class BaseGroup extends BaseSchema_1.BaseSchema {
}
__decorate([
    typegoose_1.prop({
        set: id => new mongodb_1.ObjectId(id),
        get: id => new mongodb_1.ObjectId(id),
        required: [true, "UserId 누락"]
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], BaseGroup.prototype, "userId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], BaseGroup.prototype, "name", void 0);
__decorate([
    typegoose_1.prop({ required: [true, "그룹 타입이 지정되지 않았습니다."] }),
    __metadata("design:type", String)
], BaseGroup.prototype, "type", void 0);
__decorate([
    typegoose_1.prop({
        default() {
            return genId_1.genCode(this._id);
        }
    }),
    __metadata("design:type", String)
], BaseGroup.prototype, "code", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], BaseGroup.prototype, "description", void 0);
__decorate([
    typegoose_1.prop({ default: [] }),
    __metadata("design:type", Array)
], BaseGroup.prototype, "tags", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        get: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        set: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        _id: false
    }),
    __metadata("design:type", Array)
], BaseGroup.prototype, "list", void 0);
exports.BaseGroup = BaseGroup;
//# sourceMappingURL=BaseGroup.js.map