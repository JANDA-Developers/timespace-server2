const prefix = "";
export enum ModelName {
    USER = "UserList",
    STORE = "StoreList",
    GROUP = "GroupList",
    ITEM = "ItemList",
    SALES = "SalesList",
    ZONE_INFO = "CountryInfoList",
    CONSTRAINTOR = "ConstraintorList"
}

export const getCollectionName = (modelName: ModelName): string =>
    `${prefix}${modelName}`;
