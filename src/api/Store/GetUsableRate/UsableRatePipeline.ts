import { ObjectId } from "mongodb";
import { Stage } from "../../../types/pipeline";
import { ONE_DAY } from "../../../utils/dateFuncs";
import { ProductModel } from "../../../models/Product/Product";

export const getUsableRateQuery = async (
    storeId: ObjectId,
    dateRange: {
        from: Date;
        to: Date;
    }
): Promise<Array<{
    date: Date;
    details: Array<{
        _id: ObjectId;
        segmentUsableCount: number;
        segmentCount: number;
        items: Array<{
            _id: ObjectId;
            dateTimeRange: { from: Date; to: Date };
            segmentCount: 1;
            orderCount: 1;
        }>;
    }>;
    segmentUsableCount: number;
    segmentCount: number;
    usableRate: number;
    isUsable: boolean;
}>> => {
    const originDTRange = {
        from: new Date(
            dateRange.from.getTime() - (dateRange.from.getTime() % ONE_DAY)
        ),
        to: new Date(
            dateRange.to.getTime() - (dateRange.to.getTime() % ONE_DAY)
        )
    };
    const stages: Stage[] = [
        {
            $match: {
                storeId
            }
        },
        {
            $project: {
                name: 1,
                userId: 1,
                businessHours: 1,
                capacity: 1,
                periodOption: 1,
                storeId: 1,
                originDTRange
            }
        },
        {
            $addFields: {
                dates: {
                    $map: {
                        input: {
                            $range: [
                                {
                                    $divide: [
                                        {
                                            $toLong: "$originDTRange.from"
                                        },
                                        1000
                                    ]
                                },
                                {
                                    $divide: [
                                        {
                                            $toLong: "$originDTRange.to"
                                        },
                                        1000
                                    ]
                                },
                                86400
                            ]
                        },
                        as: "raw",
                        in: {
                            $toDate: {
                                $multiply: [1000, "$$raw"]
                            }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                dates: {
                    $map: {
                        input: "$dates",
                        as: "date",
                        in: {
                            date: "$$date",
                            day: {
                                $pow: [
                                    2,
                                    {
                                        $add: [
                                            {
                                                $dayOfWeek: "$$date"
                                            },
                                            -1
                                        ]
                                    }
                                ]
                            },
                            businessHour: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$businessHours",
                                            as: "bsh",
                                            cond: {
                                                $eq: [
                                                    "$$bsh.day",
                                                    {
                                                        $pow: [
                                                            2,
                                                            {
                                                                $add: [
                                                                    {
                                                                        $dayOfWeek:
                                                                            "$$date"
                                                                    },
                                                                    -1
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                dates: {
                    $map: {
                        input: "$dates",
                        as: "date",
                        in: {
                            $mergeObjects: [
                                "$$date",
                                {
                                    segmentCount: {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            "$$date.businessHour.end",
                                                            "$$date.businessHour.start"
                                                        ]
                                                    },
                                                    "$periodOption.unit"
                                                ]
                                            },
                                            "$capacity"
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "ItemList",
                let: {
                    productId: "$_id",
                    dates: "$dates",
                    unitSec: "$periodOption.unit",
                    capacity: "$capacity"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: ["$productId", "$$productId"]
                                    },
                                    {
                                        $eq: ["$status", "PERMITTED"]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $addFields: {
                            orderCount: {
                                $ifNull: ["$orderCount", 1]
                            }
                        }
                    },
                    {
                        $project: {
                            dateTimeRange: 1,
                            date: {
                                $subtract: [
                                    "$dateTimeRange.from",
                                    {
                                        $mod: [
                                            {
                                                $toLong: "$dateTimeRange.from"
                                            },
                                            ONE_DAY
                                        ]
                                    }
                                ]
                            },
                            segmentCount: {
                                $multiply: [
                                    {
                                        $divide: [
                                            {
                                                $subtract: [
                                                    "$dateTimeRange.to",
                                                    "$dateTimeRange.from"
                                                ]
                                            },
                                            {
                                                $multiply: [60000, "$$unitSec"]
                                            }
                                        ]
                                    },
                                    "$orderCount"
                                ]
                            }
                        }
                    }
                ],
                as: "items"
            }
        },
        {
            $addFields: {
                items: "$$REMOVE",
                dates: {
                    $map: {
                        input: "$dates",
                        as: "date",
                        in: {
                            $mergeObjects: [
                                "$$date",
                                {
                                    items: {
                                        $filter: {
                                            input: "$items",
                                            as: "item",
                                            cond: {
                                                $eq: [
                                                    "$$date.date",
                                                    "$$item.date"
                                                ]
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                dates: {
                    $map: {
                        input: "$dates",
                        as: "date",
                        in: {
                            $mergeObjects: [
                                "$$date",
                                {
                                    $let: {
                                        vars: {
                                            segmentUsableCount: {
                                                $subtract: [
                                                    "$$date.segmentCount",
                                                    {
                                                        $reduce: {
                                                            input:
                                                                "$$date.items.segmentCount",
                                                            initialValue: 0,
                                                            in: {
                                                                $add: [
                                                                    "$$value",
                                                                    "$$this"
                                                                ]
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        in: {
                                            segmentUsableCount:
                                                "$$segmentUsableCount",
                                            usableRate: {
                                                $floor: {
                                                    $multiply: [
                                                        {
                                                            $divide: [
                                                                "$$segmentUsableCount",
                                                                "$$date.segmentCount"
                                                            ]
                                                        },
                                                        100
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $unwind: {
                path: "$dates",
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$dates",
                        {
                            productId: "$_id",
                            name: "$name"
                        }
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$date",
                details: {
                    $push: {
                        _id: "$productId",
                        segmentUsableCount: "$segmentUsableCount",
                        segmentCount: "$segmentCount",
                        items: "$items"
                    }
                },
                segmentUsableCount: {
                    $sum: "$segmentUsableCount"
                },
                segmentCount: {
                    $sum: "$segmentCount"
                }
            }
        },
        {
            $addFields: {
                date: "$_id",
                usableRate: {
                    $floor: {
                        $multiply: [
                            {
                                $divide: [
                                    "$segmentUsableCount",
                                    "$segmentCount"
                                ]
                            },
                            100
                        ]
                    }
                },
                "details.items.date": "$$REMOVE",
                isUsable: {
                    $ne: ["$segmentUsableCount", 0]
                }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ];
    return await ProductModel.aggregate(stages).exec();
};
