import { ObjectId } from "mongodb";
import { StoreModel } from "./Store";

export const findStore = async (id: ObjectId | string) => {
    return StoreModel.findById(id);
};
