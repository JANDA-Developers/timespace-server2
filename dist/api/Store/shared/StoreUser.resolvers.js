"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Store_1 = require("../../../models/Store/Store");
const StoreGroup_1 = require("../../../models/StoreGroup");
const resolvers = {
    StoreUser: {
        store: async (storeUser) => {
            return Store_1.StoreModel.findOne({
                _id: storeUser.storeId
            });
        },
        password: () => null,
        storeGroup: async (storeUser) => {
            return StoreGroup_1.StoreGroupModel.findOne({
                _id: storeUser.storeGroupId
            });
        },
        isPhoneVerified: async (storeUser) => {
            return storeUser.verifiedPhoneNumber;
        },
        isEmailVerified: async (storeUser) => {
            return storeUser.verifiedEmail;
        }
    }
};
exports.default = resolvers;
//# sourceMappingURL=StoreUser.resolvers.js.map