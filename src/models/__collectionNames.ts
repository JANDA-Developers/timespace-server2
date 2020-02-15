const prefix = "";
export enum ModelName {
    USER = "UserList",
    STORE = "StoreList",
    GROUP = "GroupList",
    PRODUCT = "ProductList",
    ITEM = "ItemList",
    ZONE_INFO = "CountryInfoList",
    NOTIFICATION = "Notifications",
    PAYMETHOD = "PayMethodList",
    PAYMENT_HISTORY = "PaymentHistory"
}

export const getCollectionName = (modelName: ModelName): string =>
    `${prefix}${modelName}`;
