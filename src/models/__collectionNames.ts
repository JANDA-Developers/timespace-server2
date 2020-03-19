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
    PAYMETHOD = "PayMethodList",
    PAYMENT_HISTORY = "PaymentHistory",
    SMS_TRIGGER = "SmsTriggers",
    SMS_FORMAT = "SmsFormats",
    SMS_SENDER = "SmsSenders",
    SMS_SETTINGS = "SmsSettings",
    SMS_SENT = "SmsSendHistory"
}

export const getCollectionName = (modelName: ModelName): string =>
    `${prefix}${modelName}`;
