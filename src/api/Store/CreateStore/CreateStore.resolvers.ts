import { Resolvers } from "../../../types/resolvers";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { StoreModel } from "../../../models/Store";
import { CreateStoreInput, CreateStoreResponse } from "../../../types/graph";
import { errorReturn } from "../../../utils/utils";
import { mongoose } from "@typegoose/typegoose";
import { UserModel } from "../../../models/User";
import { ObjectId } from "mongodb";
import { CountryInfoModel } from "../../../models/CountryInfo";
import { ApolloError } from "apollo-server";
import { StoreGroupModel } from "../../../models/StoreGroup";

const resolvers: Resolvers = {
    Mutation: {
        CreateStore: defaultResolver(
            privateResolver(
                async (
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
                            periodOption
                        } = param as CreateStoreInput;
                        console.log(
                            "CreateSTore ==============================="
                        );
                        console.log(businessHours);
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
                            const tz = countryInfo.timezones.find(
                                tz => tz.name === timezone
                            );
                            zoneinfo = {
                                name: countryInfo.countryName,
                                tz: tz?.name,
                                code: countryInfo.countryCode,
                                offset: tz?.offset,
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
                                group = StoreGroupModel.makeDefaultGroup(
                                    userId
                                );
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
                            businessHours,
                            periodOption,
                            manager: {
                                name:
                                    (manager && manager.name) ||
                                    cognitoUser.name,
                                phoneNumber:
                                    (manager && manager.phoneNumber) ||
                                    cognitoUser.phone_number,
                                isVerifiedPhoneNumber: false
                            },
                            groupIds: [group._id]
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
                }
            )
        )
    }
};
export default resolvers;
