import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { StoreCls, StoreModel } from "../../../models/Store/Store";
import { ProductModel } from "../../../models/Product/Product";
import { UserModel } from "../../../models/User";
import { StoreGroupModel } from "../../../models/StoreGroup";
import { StoreUserModel } from "../../../models/StoreUser/StoreUser";

const resolvers: Resolvers = {
    Store: {
        user: async (store: DocumentType<StoreCls>, args, { req }) => {
            const user = await UserModel.findById(store.userId);
            if (user) {
                await user.setAttributesFromCognito();
            }
            return user;
        },
        products: async (store: DocumentType<StoreCls>) => {
            return await ProductModel.find({
                _id: {
                    $in: store.products
                    // .map(productId => new ObjectId(productId))
                },
                isDeleted: {
                    $ne: true
                }
            });
        },
        productCount: (store: DocumentType<StoreCls>) => {
            return (store.products && store.products.length) || 0;
        },
        groups: async (store: DocumentType<StoreCls>) => {
            const groups = await StoreGroupModel.find({
                _id: {
                    $in: store.groupIds
                }
            });
            return groups;
        },
        group: async (store: DocumentType<StoreCls>) => {
            if (store.groupIds[0]) {
                store.groupId = store.groupIds[0];
                await store.save();
            }
            return StoreGroupModel.findById(store.groupId);
        },
        bookingPolicy: (store: DocumentType<StoreCls>) => {
            return (
                store.bookingPolicy || {
                    limitFirstBooking: 0,
                    limitLastBooking: 60
                }
            );
        },
        customFields: async (store: DocumentType<StoreCls>) => {
            return store.customFields.map(c => {
                return {
                    ...c,
                    isMandatory: c.isMandatory || false
                };
            });
        },
        storeUsers: async (store: DocumentType<StoreCls>) => {
            return StoreUserModel.find({
                storeId: {
                    $in: store._id
                }
            });
        },
        signUpOption: async (store: DocumentType<StoreCls>) => {
            if (!store.signUpOption) {
                await StoreModel.updateOne(
                    { _id: store._id },
                    {
                        $set: {
                            signUpOption: {
                                acceptAnonymousUser: false,
                                userAccessRange: "STORE_GROUP",
                                useSignUpAutoPermit: false,
                                useEmailVerification: false,
                                usePhoneVerification: true,
                                signUpPolicyContent: null
                            }
                        }
                    }
                );
                return {
                    acceptAnonymousUser: false,
                    userAccessRange: "STORE_GROUP",
                    useSignUpAutoPermit: false,
                    useEmailVerification: false,
                    usePhoneVerification: true
                };
            }
            return store.signUpOption;
        }
    }
};
export default resolvers;
