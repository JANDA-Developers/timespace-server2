"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStoreFunc = void 0;
const Store_1 = require("../../../models/Store/Store");
const utils_1 = require("../../../utils/utils");
const typegoose_1 = require("@typegoose/typegoose");
const User_1 = require("../../../models/User");
const mongodb_1 = require("mongodb");
const CountryInfo_1 = require("../../../models/CountryInfo");
const apollo_server_1 = require("apollo-server");
const StoreGroup_1 = require("../../../models/StoreGroup");
const SaveFileForCustomField_1 = require("./SaveFileForCustomField");
exports.createStoreFunc = async ({ args: { param }, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const { name, type, manager, description, timezone, intro, warning, groupId, businessHours, periodOption, customFieldInput, infos, bookingPolicy, usingPayment } = param;
        let zoneinfo = cognitoUser.zoneinfo;
        if (timezone) {
            const countryInfo = await CountryInfo_1.CountryInfoModel.findOne({
                "timezones.name": timezone
            });
            if (!countryInfo) {
                throw new apollo_server_1.ApolloError("Timezone 설정이 잘못되었습니다.", "UNDEFINED_COUNTRYINFO", {
                    timezone
                });
            }
            const tz = countryInfo.timezones.find(tz => tz.name === timezone);
            if (!tz) {
                throw new apollo_server_1.ApolloError(`Timezone is falcy value ${tz}`, "TIMEZONE_IS_FALCY");
            }
            zoneinfo = {
                name: countryInfo.countryName,
                tz: tz.name,
                code: countryInfo.countryCode,
                offset: tz.offset,
                callingCode: countryInfo.callingCode
            };
        }
        const userId = new mongodb_1.ObjectId(cognitoUser._id);
        let group = await StoreGroup_1.StoreGroupModel.findById(groupId);
        if (!group) {
            group = await StoreGroup_1.StoreGroupModel.findOne({
                userId,
                isDefault: true
            });
            if (!group) {
                group = StoreGroup_1.StoreGroupModel.makeDefaultGroup(userId);
                await User_1.UserModel.updateOne({ _id: userId }, {
                    $push: {
                        groupsIds: group._id
                    }
                }, {
                    session
                });
                await group.save({ session });
            }
        }
        const customFields = await SaveFileForCustomField_1.saveFilesForCustomField(cognitoUser.sub, customFieldInput);
        const _id = new mongodb_1.ObjectId();
        const store = new Store_1.StoreModel({
            _id,
            userId,
            name,
            type,
            zoneinfo,
            description,
            warning,
            intro,
            infos,
            periodOption: {
                ...periodOption,
                offset: periodOption.offset === null ||
                    periodOption.offset === undefined
                    ? zoneinfo.offset
                    : periodOption.offset
            },
            businessHours,
            manager: {
                name: (manager && manager.name) || cognitoUser.name,
                phoneNumber: (manager && manager.phoneNumber) ||
                    cognitoUser.phone_number,
                isVerifiedPhoneNumber: false
            },
            groupId: group._id,
            customFields,
            bookingPolicy: bookingPolicy || {
                limitFirstBooking: 0,
                limitLastBooking: 30
            },
            usingPayment: usingPayment
        });
        await store.save({ session });
        await StoreGroup_1.StoreGroupModel.updateOne({
            _id: group._id
        }, {
            $push: {
                list: _id
            }
        }, {
            session
        });
        await User_1.UserModel.updateOne({ _id: userId }, {
            $push: {
                stores: _id
            }
        }, {
            session
        });
        stack.push(cognitoUser, store);
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: store
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
//# sourceMappingURL=CreateStoreFunc.js.map