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
exports.createSchemaOptions = exports.BaseSchema = void 0;
const mongodb_1 = require("mongodb");
const typegoose_1 = require("@typegoose/typegoose");
let BaseSchema = class BaseSchema {
};
__decorate([
    typegoose_1.prop({
        default: () => new mongodb_1.ObjectId(),
        get: id => new mongodb_1.ObjectId(id),
        set: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], BaseSchema.prototype, "_id", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Date)
], BaseSchema.prototype, "createdAt", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Date)
], BaseSchema.prototype, "updatedAt", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Date)
], BaseSchema.prototype, "expiresAt", void 0);
BaseSchema = __decorate([
    typegoose_1.index({
        expiresAt: 1
    }, {
        expireAfterSeconds: 0
    })
], BaseSchema);
exports.BaseSchema = BaseSchema;
exports.createSchemaOptions = (collection) => {
    return {
        schemaOptions: {
            timestamps: true,
            collection
        }
    };
};
//# sourceMappingURL=BaseSchema.js.map