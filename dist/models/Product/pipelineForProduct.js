"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentWithItemsPipeline = void 0;
exports.segmentWithItemsPipeline = (product, dateTimeRange, itemStatus = "PERMITTED") => [
    {
        $match: {
            productId: product._id,
            "dateTimeRange.from": {
                $lt: dateTimeRange.to
            },
            "dateTimeRange.to": {
                $gt: dateTimeRange.from
            },
            status: itemStatus
        }
    },
    {
        $addFields: {
            segments: {
                $range: [
                    {
                        $divide: [
                            {
                                $toLong: "$dateTimeRange.from"
                            },
                            1000
                        ]
                    },
                    {
                        $divide: [
                            {
                                $toLong: "$dateTimeRange.to"
                            },
                            1000
                        ]
                    },
                    // unit
                    product.periodOption.unit * 60
                ]
            }
        }
    },
    {
        $unwind: {
            path: "$segments",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    {
                        _id: "$segments"
                    },
                    {
                        item: {
                            _id: "$_id",
                            name: "$name",
                            dateTimeRange: "$dateTimeRange",
                            productId: "$productId",
                            storeId: "$storeId",
                            buyerId: "$buyerId",
                            code: "$code",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt"
                        }
                    }
                ]
            }
        }
    },
    {
        $group: {
            _id: "$_id",
            items: {
                $addToSet: "$item"
            }
        }
    },
    {
        $addFields: {
            segment: {
                from: {
                    $toDate: {
                        $multiply: ["$_id", 1000]
                    }
                },
                to: {
                    $toDate: {
                        $multiply: [
                            { $add: ["$_id", product.periodOption.unit * 60] },
                            1000
                        ]
                    }
                }
            },
            count: {
                $size: "$items"
            },
            maxCount: product.capacity,
            soldOUt: {
                $lte: [
                    product.capacity,
                    {
                        $size: "$items"
                    }
                ]
            }
        }
    },
    {
        $sort: {
            "segment.from": 1
        }
    }
];
//# sourceMappingURL=pipelineForProduct.js.map