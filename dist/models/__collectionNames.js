"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectionName = exports.ModelName = void 0;
const prefix = "";
var ModelName;
(function (ModelName) {
    ModelName["USER"] = "UserList";
    ModelName["BUYER"] = "BuyerList";
    ModelName["STORE"] = "StoreList";
    ModelName["GROUP"] = "GroupList";
    ModelName["PRODUCT"] = "ProductList";
    ModelName["ITEM"] = "ItemList";
    ModelName["ITEM_STATUS_CHANGE"] = "ItemStatusChangeHistory";
    ModelName["ZONE_INFO"] = "CountryInfoList";
    ModelName["NOTIFICATION"] = "Notifications";
    ModelName["PAYMENT_HISTORY"] = "PaymentHistory";
    ModelName["STORE_USER"] = "StoreUser";
    ModelName["TRANSACTION"] = "Transaction";
    ModelName["PRIVACY_POLICY"] = "PrivacyPolicy";
    ModelName["VERIFICATION"] = "Verification";
})(ModelName = exports.ModelName || (exports.ModelName = {}));
exports.getCollectionName = (modelName) => `${prefix}${modelName}`;
//# sourceMappingURL=__collectionNames.js.map