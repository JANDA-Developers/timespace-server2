import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { StoreCls, StoreModel } from "../../../models/Store/Store";
import { StoreUserCls } from "../../../models/StoreUser/StoreUser";
import { StoreGroupModel, StoreGroupCls } from "../../../models/StoreGroup";

const resolvers: Resolvers = {
    StoreUser: {
        store: async (
            storeUser: DocumentType<StoreUserCls>
        ): Promise<DocumentType<StoreCls> | null> => {
            return StoreModel.findOne({
                _id: storeUser.storeId
            });
        },
        password: () => null,
        storeGroup: async (
            storeUser: DocumentType<StoreUserCls>
        ): Promise<DocumentType<StoreGroupCls> | null> => {
            return StoreGroupModel.findOne({
                _id: storeUser.storeGroupId
            });
        }
    }
};
export default resolvers;
