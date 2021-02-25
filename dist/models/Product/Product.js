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
exports.ProductModel = exports.ProductCls = void 0;
const BaseSchema_1 = require("../../abs/BaseSchema");
const typegoose_1 = require("@typegoose/typegoose");
const __collectionNames_1 = require("../__collectionNames");
const mongodb_1 = require("mongodb");
const genId_1 = require("../utils/genId");
const apollo_server_1 = require("apollo-server");
const periodFuncs_1 = require("../../utils/periodFuncs");
const Item_1 = require("../Item/Item");
const values_1 = require("../../types/values");
const dateFuncs_1 = require("../../utils/dateFuncs");
const DateTimeRange_1 = require("../../utils/DateTimeRange");
const objectFuncs_1 = require("../../utils/objectFuncs");
const pipelineForProduct_1 = require("./pipelineForProduct");
const propOptions_1 = require("../_propValidateOptions/propOptions");
let ProductCls = class ProductCls extends BaseSchema_1.BaseSchema {
    async segmentListWithItems(dateTimeRange, unit) {
        const query = pipelineForProduct_1.segmentWithItemsPipeline(this, dateTimeRange, "PERMITTED");
        const productSegmentList = await Item_1.ItemModel.aggregate(query);
        return productSegmentList;
    }
    /**
     * dateTimeRange 를 segment로 나누어 배열로 출력함.
     * items가 없는 segment도 포함하여 출력
     */
    async getSegmentSchedules(dateTimeRange, soldOut) {
        const unit = this.periodOption.unit;
        const productSegmentList = await this.segmentListWithItems(dateTimeRange, unit);
        const segmentList = periodFuncs_1.divideDateTimeRange(dateTimeRange, unit);
        const real = segmentList.map(segment => {
            return {
                itemCount: 0,
                segment,
                maxCount: this.capacity,
                soldOut: false,
                items: []
            };
        });
        console.log("Product.ts => getSegmentSchedules==============================================");
        real.forEach(o => {
            const filtered = productSegmentList.filter(i => i._id * 1000 === o.segment.from.getTime());
            const item = filtered[0];
            // console.log({
            //     filteredItem: item
            // });
            if (item) {
                o.itemCount = item.count;
                o.items.push(...item.items.map(i => i._id));
                o.soldOut = this.capacity <= item.count;
            }
        });
        if (soldOut !== undefined || soldOut === null) {
            // soldOut false, true 둘중 하나 출력
            return real.filter(r => r.soldOut === soldOut);
        }
        return real;
    }
    /**
     * 해당 기간에 어떤 Item들이 들어있는지... paging 안되어있음.
     * @param dateTimeRange 날짜 범위 ㄱㄱ
     */
    async getItems(date, status) {
        date.setUTCHours(0, 0, 0, 0);
        const dateTimeRange = periodFuncs_1.getDateTimeRangeFromPeriodList(this.businessHours, date, this.periodOption.offset);
        if (!dateTimeRange) {
            throw new apollo_server_1.ApolloError("포함되지 않는 날짜입니다.", values_1.ERROR_CODES.UNAVAILABLE_QUERY_DATE);
        }
        const { from, to } = dateTimeRange;
        const interval = Math.floor((from.getTime() - to.getTime()) / dateFuncs_1.ONE_MINUTE);
        const { unit } = this.periodOption;
        if (interval % unit !== 0) {
            throw new apollo_server_1.ApolloError("dateTimeRange 값이 잘못되었습니다. (unit Error)", values_1.ERROR_CODES.DATETIMERANGE_UNIT_ERROR, {
                from,
                to,
                interval
            });
        }
        const items = await Item_1.ItemModel.find(objectFuncs_1.removeUndefined({
            productId: this._id,
            "dateTimeRange.from": {
                $lte: to
            },
            "dateTimeRange.to": {
                $gt: from
            },
            status,
            expiresAt: {
                $exists: false
            }
        }));
        return items;
    }
    async getSchedulesByDate(date, soldOut) {
        console.log("getSchedulesByDate ===================================");
        const unit = this.periodOption.unit;
        date.setUTCHours(0, 0, 0, 0);
        const dateTimeRange = periodFuncs_1.getDateTimeRangeFromPeriodList(this.businessHours, date, this.periodOption.offset);
        if (!dateTimeRange) {
            return {
                info: {
                    isOpenDate: false,
                    dateTimeRange: new DateTimeRange_1.DateTimeRangeCls({
                        from: date,
                        to: date
                    }),
                    unit
                },
                list: []
            };
        }
        const itemExistsList = await this.getSegmentSchedules(dateTimeRange, soldOut);
        const list = await Promise.all(itemExistsList.map(async (o) => {
            return {
                ...o,
                items: (await Item_1.ItemModel.find({
                    _id: { $in: o.items },
                    expiresAt: {
                        $exists: false
                    }
                }))
            };
        }));
        return {
            info: {
                dateTimeRange,
                unit,
                isOpenDate: true
            },
            list
        };
    }
};
ProductCls.findByCode = async (productCode) => {
    const product = await exports.ProductModel.findOne({
        code: productCode
    });
    if (!product) {
        throw new apollo_server_1.ApolloError("존재하지 않는 StoreCode입니다", "UNEXIST_ITEMCODE");
    }
    return product;
};
__decorate([
    typegoose_1.prop({
        required: [true, "[UNAUTHORIZED] 로그인 후 사용해주세요."],
        get: id => new mongodb_1.ObjectId(id),
        set: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ProductCls.prototype, "userId", void 0);
__decorate([
    typegoose_1.prop({
        required: [true, "상점정보가 존재하지 않습니다."],
        get: id => new mongodb_1.ObjectId(id),
        set: id => new mongodb_1.ObjectId(id)
    }),
    __metadata("design:type", mongodb_1.ObjectId)
], ProductCls.prototype, "storeId", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ProductCls.prototype, "name", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ProductCls.prototype, "subTitle", void 0);
__decorate([
    typegoose_1.prop({
        default() {
            return `${genId_1.genCode(this.storeId)}-${genId_1.s4(36).toUpperCase()}`;
        }
    }),
    __metadata("design:type", String)
], ProductCls.prototype, "code", void 0);
__decorate([
    typegoose_1.prop({ default: [] }),
    __metadata("design:type", Array)
], ProductCls.prototype, "images", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ProductCls.prototype, "description", void 0);
__decorate([
    typegoose_1.prop({ default: () => false }),
    __metadata("design:type", Boolean)
], ProductCls.prototype, "needToConfirm", void 0);
__decorate([
    typegoose_1.prop({ default: () => false }),
    __metadata("design:type", Boolean)
], ProductCls.prototype, "needToPermit", void 0);
__decorate([
    typegoose_1.prop({ default: () => false }),
    __metadata("design:type", Boolean)
], ProductCls.prototype, "usingPayment", void 0);
__decorate([
    typegoose_1.prop({ default: () => 0 }),
    __metadata("design:type", Number)
], ProductCls.prototype, "defaultPrice", void 0);
__decorate([
    typegoose_1.prop({ default: () => 0 }),
    __metadata("design:type", Number)
], ProductCls.prototype, "segmentPrice", void 0);
__decorate([
    typegoose_1.prop({ default: false }),
    __metadata("design:type", Boolean)
], ProductCls.prototype, "isDeleted", void 0);
__decorate([
    typegoose_1.prop({
        default: () => 1,
        validate: [
            {
                validator: (v) => v >= 0,
                message: "capacity는 음수가 될 수 없습니다."
            }
        ],
        required: [true, "Capacity가 설정되지 않았습니다. "]
    }),
    __metadata("design:type", Number)
], ProductCls.prototype, "capacity", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ProductCls.prototype, "intro", void 0);
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", String)
], ProductCls.prototype, "warning", void 0);
__decorate([
    typegoose_1.prop({
        validate: [
            {
                validator(businessHours) {
                    return (businessHours.filter(period => period.time < this.periodOption.max).length === 0);
                },
                message: "BusinessHours.time 값이 periodOption.max보다 작습니다."
            },
            {
                validator(businessHours) {
                    const unit = this.periodOption.unit;
                    return (businessHours.filter(({ time }) => time % unit !== 0)
                        .length === 0);
                },
                message: "BusinessHours.time 값이 unit의 배수가 아닙니다."
            },
            {
                validator(businessHours) {
                    return (businessHours.filter(({ start, end }) => start >= end)
                        .length === 0);
                },
                message: "end값이 start보다 작거나 같습니다."
            }
        ],
        required: [true, "BusinessHours가 설정되지 않았습니다."],
        get(periodArr) {
            return periodFuncs_1.getPeriodFromDB(periodArr, this.periodOption.offset);
        },
        set(periodArr) {
            try {
                return periodFuncs_1.setPeriodToDB(periodArr, this.periodOption.offset);
            }
            catch (error) {
                return [];
            }
        },
        default: []
    }),
    __metadata("design:type", Array)
], ProductCls.prototype, "businessHours", void 0);
__decorate([
    typegoose_1.prop(propOptions_1.propOptPeriodOption({
        required: [true, "PeriodOption가 설정되지 않았습니다."]
    })),
    __metadata("design:type", Object)
], ProductCls.prototype, "periodOption", void 0);
__decorate([
    typegoose_1.prop({
        default: []
    }),
    __metadata("design:type", Array)
], ProductCls.prototype, "infos", void 0);
__decorate([
    typegoose_1.prop({
        default: () => {
            return {
                limitFirstBooking: 0,
                limitLastBooking: 60
            };
        }
    }),
    __metadata("design:type", Object)
], ProductCls.prototype, "bookingPolicy", void 0);
ProductCls = __decorate([
    typegoose_1.modelOptions(BaseSchema_1.createSchemaOptions(__collectionNames_1.getCollectionName(__collectionNames_1.ModelName.PRODUCT)))
], ProductCls);
exports.ProductCls = ProductCls;
exports.ProductModel = typegoose_1.getModelForClass(ProductCls);
//# sourceMappingURL=Product.js.map