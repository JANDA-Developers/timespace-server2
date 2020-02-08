import { Resolvers } from "../../../types/resolvers";
import { DocumentType } from "@typegoose/typegoose";
import { StoreCls } from "../../../models/Store";
import { ApolloError } from "apollo-server";
import { ObjectId } from "mongodb";
import { ItemModel } from "../../../models/Item";

const resolvers: Resolvers = {
    Store: {
        user: async (store: DocumentType<StoreCls>, args, { req }) => {
            const { cognitoUser } = req;
            if (!new ObjectId(cognitoUser._id).equals(store.user)) {
                throw new ApolloError(
                    "User 사용 권한이 없습니다.",
                    "ACCESS_USER_PERMISSION_DENY"
                );
            }
            return cognitoUser;
        },
        items: async (store: DocumentType<StoreCls>) => {
            return await ItemModel.find({
                _id: {
                    $in: store.items
                    // .map(itemId => new ObjectId(itemId))
                }
            });
        }
    }
};
export default resolvers;
