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
exports.UserModel = exports.UserCls = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("./__collectionNames");
const mongodb_1 = require("mongodb");
const apollo_server_1 = require("apollo-server");
const BaseSchema_1 = require("../abs/BaseSchema");
const aws_sdk_1 = require("aws-sdk");
const values_1 = require("../types/values");
const dateFuncs_1 = require("../utils/dateFuncs");
const Store_1 = require("./Store/Store");
const Item_1 = require("./Item/Item");
const Product_1 = require("./Product/Product");
const StoreGroup_1 = require("./StoreGroup");
const ItemStatusChanged_1 = require("./ItemStatusChangedHistory/ItemStatusChanged");
let UserCls = class UserCls extends BaseSchema_1.BaseSchema {
    async setAttributesFromCognito(user) {
        let cognitoUser = user;
        if (!cognitoUser) {
            const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
            cognitoUser = await cognito
                .adminGetUser({
                UserPoolId: process.env.COGNITO_POOL_ID || "",
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
    async deleteUser(session, expiresAt = new Date(new Date().getTime() + 7 * dateFuncs_1.ONE_DAY)) {
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        const result = await cognito
            .adminDeleteUser({
            UserPoolId: process.env.COGNITO_POOL_ID || "",
            Username: this.sub
        })
            .promise();
        if (result.$response.error) {
            throw result.$response.error;
        }
        const expireQuery = { $set: { expiresAt } };
        const userId = this._id;
        await Store_1.StoreModel.updateMany({
            userId
        }, expireQuery, {
            session
        });
        await Product_1.ProductModel.updateMany({
            userId
        }, expireQuery, {
            session
        });
        await Item_1.ItemModel.updateMany({
            buyerId: this._id
        }, expireQuery, { session });
        await StoreGroup_1.StoreGroupModel.updateMany({
            userId
        }, expireQuery, {
            session
        });
        await ItemStatusChanged_1.ItemStatusChangedHistoryModel.updateMany({
            workerId: this._id
        }, expireQuery, {
            session
        });
        this.expiresAt = expiresAt;
    }
    async updateUser(attributes) {
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        const cognitoUpdateResult = await cognito
            .adminUpdateUserAttributes({
            UserAttributes: attributes,
            UserPoolId: process.env.COGNITO_POOL_ID || "",
            Username: this.sub
        })
            .promise();
        if (cognitoUpdateResult.$response.error) {
            throw cognitoUpdateResult.$response.error;
        }
        return true;
    }
};
UserCls.findBySub = async (sub) => {
    const user = await exports.UserModel.findOne({
        sub
    });
    if (!user) {
        throw new apollo_server_1.ApolloError("존재하지 않는 UserSub입니다", values_1.ERROR_CODES.INVALID_USER_SUB, { userSub: sub });
    }
    await user.setAttributesFromCognito();
    return user;
};
UserCls.findUser = async (cognitoUser) => {
    const user = await exports.UserModel.findOne({
        sub: cognitoUser.sub
    });
    if (!user) {
        throw new apollo_server_1.ApolloError("존재하지 않는 UserSub입니다", values_1.ERROR_CODES.INVALID_USER_SUB, { user: cognitoUser });
    }
    await user.setAttributesFromCognito(cognitoUser);
    return user;
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], UserCls.prototype, "email", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], UserCls.prototype, "smsKey", void 0);
__decorate([
    typegoose_1.prop({ default: [] }),
    __metadata("design:type", Array)
], UserCls.prototype, "roles", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], UserCls.prototype, "sub", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], UserCls.prototype, "refreshToken", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], UserCls.prototype, "confirmationCode", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Date)
], UserCls.prototype, "refreshTokenLastUpdate", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Object)
], UserCls.prototype, "zoneinfo", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", Array)
], UserCls.prototype, "loginInfos", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        get: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        set: (ids) => ids.map(id => new mongodb_1.ObjectId(id))
    }),
    __metadata("design:type", Array)
], UserCls.prototype, "stores", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        get: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        set: (ids) => ids.map(id => new mongodb_1.ObjectId(id))
    }),
    __metadata("design:type", Array)
], UserCls.prototype, "disabledStores", void 0);
__decorate([
    typegoose_1.prop({
        default: [],
        get: (ids) => ids.map(id => new mongodb_1.ObjectId(id)),
        set: (ids) => ids.map(id => new mongodb_1.ObjectId(id))
    }),
    __metadata("design:type", Array)
], UserCls.prototype, "groupIds", void 0);
UserCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.USER)))
], UserCls);
exports.UserCls = UserCls;
exports.UserModel = typegoose_1.getModelForClass(UserCls);
//# sourceMappingURL=User.js.map