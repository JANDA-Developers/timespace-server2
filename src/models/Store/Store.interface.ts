import { BaseSchema } from "../../abs/BaseSchema";
import { ObjectId } from "mongodb";
import {
    Zoneinfo,
    StoreType,
    Manager,
    PeriodOption,
    Location,
    Info
} from "GraphType";
import { PeriodWithDays } from "../../utils/PeriodWithDays";
import { CustomFieldCls } from "../../types/types";

export interface StoreProps extends BaseSchema {
    userId: ObjectId;
    zoneinfo: Zoneinfo;
    name: string;
    type: StoreType;
    code: string;
    image: string;
    description: string;
    products: ObjectId[];
    usingPeriodOption: boolean;
    usingCapacityOption: boolean;
    manager: Manager;
    location: Location;
    businessHours: Array<PeriodWithDays>;
    periodOption: PeriodOption;
    groupIds: ObjectId[];
    warning: string;
    intro: string;
    customFields: CustomFieldCls[];
    infos: Info[];
}

export interface StoreFuncs {}
