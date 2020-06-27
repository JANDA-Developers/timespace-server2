import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { StoreCls, StoreModel } from "../../../models/Store/Store";
import { StoreUserCls } from "../../../models/StoreUser";

const resolvers: Resolvers = {
    StoreUser: {
        store: async (
            storeUser: DocumentType<StoreUserCls>
        ): Promise<DocumentType<StoreCls> | null> => {
            return StoreModel.findOne({
                _id: storeUser.storeId,
                code: storeUser.storeCode
            });
        },
        password: () => null
    }
};
export default resolvers;
