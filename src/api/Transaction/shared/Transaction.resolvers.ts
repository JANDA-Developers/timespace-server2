import { Resolvers } from "../../../types/resolvers";
import { UserModel } from "../../../models/User";
import { DocumentType } from "@typegoose/typegoose";
import { TransactionCls } from "../../../models/Transaction/Transaction";
import { StoreModel } from "../../../models/Store/Store";
import { StoreUserModel } from "../../../models/StoreUser/StoreUser";
import { ItemModel } from "../../../models/Item/Item";

const resolvers: Resolvers = {
    Transaction: {
        seller: async (trx: DocumentType<TransactionCls>) => {
            // 정보유출 위험있음.
            // Null로 저리하거나 해야할듯함.
            return UserModel.findById(trx.sellerId);
        },
        store: async (trx: DocumentType<TransactionCls>) => {
            return StoreModel.findById(trx.sellerId);
        },
        storeUser: async (trx: DocumentType<TransactionCls>) => {
            return StoreUserModel.findById(trx.sellerId);
        },
        item: async (trx: DocumentType<TransactionCls>) => {
            return ItemModel.findById(trx.itemId);
        },
        amount: async (trx: DocumentType<TransactionCls>) => {
            return trx.amountInfo.origin;
        }
    }
};

export default resolvers;
