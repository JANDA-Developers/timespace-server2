import { Resolvers } from "../../../types/resolvers";
import { ItemModel } from "../../../models/Item/Item";

const resolvers: Resolvers = {
    Buyer: {
        _id: cognitoBuyer =>
            (cognitoBuyer && cognitoBuyer["custom:_id"]) || cognitoBuyer._id,
        tokenExpiry: buyer => buyer.exp,
        zoneinfo: buyer =>
            typeof buyer.zoneinfo === "string"
                ? JSON.parse(buyer.zoneinfo)
                : buyer.zoneinfo,
        items: async buyer =>
            await ItemModel.find({ _id: { $in: buyer.items } })
    }
};
export default resolvers;
