const prefix = "";
export enum ModelName {
    USER = "UserList",
    BUYER = "BuyerList",
    STORE = "StoreList",
    GROUP = "GroupList",
    PRODUCT = "ProductList",
    ITEM = "ItemList",
    ITEM_STATUS_CHANGE = "ItemStatusChangeHistory",
    ZONE_INFO = "CountryInfoList",
    NOTIFICATION = "Notifications",
    PAYMENT_HISTORY = "PaymentHistory",
    STORE_USER = "StoreUser",
    TRANSACTION = "Transaction",
    PRIVACY_POLICY = "PrivacyPolicy",
    VERIFICATION = "Verification"
}

export const getCollectionName = (modelName: ModelName): string =>
    `${prefix}${modelName}`;
