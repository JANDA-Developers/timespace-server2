"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDuplicatedItems = exports.findItem = void 0;
const Item_1 = require("./Item");
// type Segment = {
//     from: Date;
//     to: Date;
// };
// type TimeRanges = {
//     from: Date;
//     to: Date;
// };
// type SegmentWithCapacity = {
//     segment: Segment;
//     isFull: boolean;
//     usage: number;
//     capacity: number;
// };
exports.findItem = async (itemId) => {
    const item = await Item_1.ItemModel.findById(itemId);
    if (!item) {
        throw new Error("존재하지 않는 ItemId");
    }
    return item;
};
exports.findDuplicatedItems = async (item, includeStatuses = ["PENDING"]) => {
    const { dateTimeRange } = item;
    const from = dateTimeRange.from;
    const to = dateTimeRange.to;
    const query = {
        _id: {
            $ne: item._id
        },
        "dateTimeRange.from": {
            $lt: to
        },
        "dateTimeRange.to": {
            $gt: from
        },
        status: {
            $in: includeStatuses
        },
        expiresAt: {
            $exists: false
        }
    };
    const duplicatedItems = Item_1.ItemModel.find(query).exec();
    return duplicatedItems;
};
// export const permitItem = async (
//     input: { itemId: ObjectId; comment?: string | null },
//     session?: ClientSession
// ): Promise<DocumentType<ItemCls>> => {
//     const { itemId, comment } = input;
//     const item = await findItem(itemId);
//     const product = await findProduct(item.productId);
//     const periodOption = product.periodOption;
//     // Pending인 시간 중복인 Item들 가져오기
//     const duplicatedItems = await findDuplicatedItems(item);
//     // Segment 별로 capacity를 초과하는지 검사해야함.
//     const segments = getSegments(item.dateTimeRange, periodOption.unit);
//     duplicatedItems.forEach(itm => {
//         // TODO: Segment.from, Segment.to 가지고 체크
//         // 는.. 이거 구현할 필요가 없어졌다.. 왜냐하면. Segment가 없어질거거든 ㅜ
//     });
//     return item;
// };
// export const getSegments = (
//     timeRange: { from: Date; to: Date },
//     unit: Minute
// ) => {
//     const start = new Date(timeRange.from);
//     const segments: Segment[] = [];
//     while (start.getTime() < timeRange.to.getTime()) {
//         const end = new Date(start.getTime() + unit * ONE_MINUTE);
//         segments.push({
//             from: new Date(start.getTime()),
//             to: end
//         });
//         start.setTime(end.getTime());
//     }
//     return segments;
// };
// export const getSegmentsWithCapacity = (
//     items: DocumentType<ItemCls>[],
//     timeRanges: TimeRanges,
//     unit: Minute,
//     capacity: number
// ): SegmentWithCapacity[] => {
//     const result: SegmentWithCapacity[] = [];
//     const segments = getSegments(timeRanges, unit);
//     segments.forEach(segment => {
//         result.push({
//             segment,
//             capacity,
//             // isInclude라는 함수가 필요할듯 하다.
//             usage: items.map(item => item.dateTimeRange)
//         });
//     });
//     return result;
// };
// export const calculateCapacity = async (
//     productId: ObjectId | string,
//     timeRange: {
//         from: Date;
//         to: Date;
//     }
// ): Promise<boolean> => {
//     const product = await findProduct(productId);
//     const itmes = await ItemModel.find({
//         product
//     });
//     return false;
// };
// export const cancelItems = async (): Promise<any> => {};
//# sourceMappingURL=ItemModelFunctions.js.map