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
exports.BuyerModel = exports.BuyerCls = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("./__collectionNames");
const apollo_server_1 = require("apollo-server");
const BaseSchema_1 = require("../abs/BaseSchema");
const aws_sdk_1 = require("aws-sdk");
const values_1 = require("../types/values");
const dateFuncs_1 = require("../utils/dateFuncs");
const Item_1 = require("./Item/Item");
const ItemStatusChanged_1 = require("./ItemStatusChangedHistory/ItemStatusChanged");
let BuyerCls = class BuyerCls extends BaseSchema_1.BaseSchema {
    async setAttributesFromCognito(user) {
        let cognitoUser = user;
        if (!cognitoUser) {
            const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
            cognitoUser = await cognito
                .adminGetUser({
                UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
                Username: this.sub
            })
                .promise();
            const attributes = cognitoUser.UserAttributes;
            if (attributes) {
                attributes.forEach(attr => {
                    const { Name, Value } = attr;
                    if (Name === "zoneinfo") {
                        this.zoneinfo = JSON.parse(Value || "");
                    }
                    else if (Value) {
                        if (Value === "true" || Value === "false") {
                            this[Name] = Value === "true";
                        }
                        else {
                            this[Name] = Value;
                        }
                    }
                });
            }
        }
        else {
            for (const key in cognitoUser) {
                const value = cognitoUser[key];
                if (value !== undefined) {
                    this[key] = value;
                }
            }
        }
    }
    async deleteBuyer(session, expiresAt = new Date(new Date().getTime() + 7 * dateFuncs_1.ONE_DAY)) {
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        const result = await cognito
            .adminDeleteUser({
            UserPoolId: process.env.COGNITO_POOL_ID_BUYER || "",
            Username: this.sub
        })
            .promise();
        if (result.$response.error) {
            throw result.$response.error;
        }
        const expireQuery = { $set: { expiresAt } };
        await Item_1.ItemModel.updateMany({
            buyerId: this._id
        }, expireQuery, { session });
        await ItemStatusChanged_1.ItemStatusChangedHistoryModel.updateMany({
            workerId: this._id
        }, expireQuery, {
            session
        });
        this.expiresAt = expiresAt;
    }
};
BuyerCls.findBySub = async (sub) => {
    const buyer = await exports.BuyerModel.findOne({
        sub
    });
    if (!buyer) {
        throw new apollo_server_1.ApolloError("존재하지 않는 UserSub입니다", values_1.ERROR_CODES.INVALID_USER_SUB, { userSub: sub });
    }
    await buyer.setAttributesFromCognito();
    return buyer;
};
BuyerCls.findBuyer = async (cognitoBuyer) => {
    const buyer = await exports.BuyerModel.findOne({
        sub: cognitoBuyer.sub
    });
    if (!buyer) {
        throw new apollo_server_1.ApolloError("존재하지 않는 UserSub입니다", values_1.ERROR_CODES.INVALID_USER_SUB, { user: cognitoBuyer });
    }
    await buyer.setAttributesFromCognito(cognitoBuyer);
    return buyer;
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], BuyerCls.prototype, "email", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], BuyerCls.prototype, "sub", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], BuyerCls.prototype, "refreshToken", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Date)
], BuyerCls.prototype, "refreshTokenLastUpdate", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Object)
], BuyerCls.prototype, "zoneinfo", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Array)
], BuyerCls.prototype, "itemIds", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], BuyerCls.prototype, "company", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], BuyerCls.prototype, "confirmationCode", void 0);
BuyerCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.BUYER)))
], BuyerCls);
exports.BuyerCls = BuyerCls;
exports.BuyerModel = typegoose_1.getModelForClass(BuyerCls);
//# sourceMappingURL=Buyer.js.map