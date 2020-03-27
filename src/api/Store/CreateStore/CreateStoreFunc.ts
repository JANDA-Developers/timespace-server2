import { StoreModel } from "../../../models/Store/Store";
import {
    CreateStoreInput,
    CreateStoreResponse,
    CustomFieldDefineInput
} from "GraphType";
import { errorReturn } from "../../../utils/utils";
import { mongoose } from "@typegoose/typegoose";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";
import { CountryInfoModel } from "../../../models/CountryInfo";
import { ApolloError } from "apollo-server";
import { StoreGroupModel } from "../../../models/StoreGroup";
import { ResolverFunction } from "../../../types/resolvers";
import { uploadFile } from "../../../utils/s3Funcs";
import { CustomFieldCls } from "../../../types/types";

export const createStoreFunc: ResolverFunction = async (
    { args: { param }, context: { req } },
    stack
): Promise<CreateStoreResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cognitoUser } = req;
        const {
            name,
            type,
            manager,
            description,
            timezone,
            intro,
            warning,
            groupId,
            businessHours,
            periodOption,
            customFieldInput,
            infos,
            bookingPolicy
        } = param as CreateStoreInput;
        let zoneinfo = cognitoUser.zoneinfo;
        if (timezone) {
            const countryInfo = await CountryInfoModel.findOne({
                "timezones.name": timezone
            });
            if (!countryInfo) {
                throw new ApolloError(
                    "Timezone 설정이 잘못되었습니다.",
                    "UNDEFINED_COUNTRYINFO",
                    {
                        timezone
                    }
                );
            }
            const tz = countryInfo.timezones.find(tz => tz.name === timezone);
            if (!tz) {
                throw new ApolloError(
                    `Timezone is falcy value ${tz}`,
                    "TIMEZONE_IS_FALCY"
                );
            }
            zoneinfo = {
                name: countryInfo.countryName,
                tz: tz.name,
                code: countryInfo.countryCode,
                offset: tz.offset,
                callingCode: countryInfo.callingCode
            };
        }
        const userId = new ObjectId(cognitoUser._id);
        let group = await StoreGroupModel.findById(groupId);
        if (!group) {
            group = await StoreGroupModel.findOne({
                userId,
                isDefault: true
            });
            if (!group) {
                group = StoreGroupModel.makeDefaultGroup(userId);
                await UserModel.updateOne(
                    { _id: userId },
                    {
                        $push: {
                            groupsIds: group._id
                        }
                    },
                    {
                        session
                    }
                );
                await group.save({ session });
            }
        }
        const customFields = await saveFilesForCustomField(
            cognitoUser.sub,
            customFieldInput
        );
        const _id = new ObjectId();
        const store = new StoreModel({
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
                offset:
                    periodOption.offset === null ||
                    periodOption.offset === undefined
                        ? zoneinfo.offset
                        : periodOption.offset
            },
            businessHours,
            manager: {
                name: (manager && manager.name) || cognitoUser.name,
                phoneNumber:
                    (manager && manager.phoneNumber) ||
                    cognitoUser.phone_number,
                isVerifiedPhoneNumber: false
            },
            groupIds: [group._id],
            customFields: customFields,
            bookingPolicy: bookingPolicy || {
                limitFirstBooking: 0,
                limitLastBooking: 30
            }
        });
        await store.save({ session });
        await StoreGroupModel.updateOne(
            {
                _id: group._id
            },
            {
                $push: {
                    list: _id
                }
            },
            {
                session
            }
        );
        await UserModel.updateOne(
            { _id: userId },
            {
                $push: {
                    stores: _id
                }
            },
            {
                session
            }
        );
        stack.push(cognitoUser, store);

        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null,
            data: store as any
        };
    } catch (error) {
        return await errorReturn(error, session);
    }
};

const saveFilesForCustomField = async (
    userSub: string,
    customFields: CustomFieldDefineInput[]
): Promise<CustomFieldCls[]> => {
    const baseDir = `${userSub}/cf/`;
    const result: CustomFieldCls[] = await Promise.all(
        customFields.map(
            async (cf): Promise<CustomFieldCls> => {
                const field: CustomFieldCls = {
                    ...cf,
                    fileUrl: null,
                    key: new ObjectId(),
                    isMandatory: cf.isMandatory || false
                };
                if (cf.file && cf.type === "FILE") {
                    const { url } = await uploadFile(cf.file, {
                        dir: baseDir
                    });
                    field.fileUrl = url;
                }

                return field;
            }
        )
    );
    return result;
};
