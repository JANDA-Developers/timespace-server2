import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CreateItemForBuyerResponse,
    CreateItemForBuyerInput,
    DateTimeRangeInput,
    SmsFormatAttribute
} from "GraphType";
import {
    defaultResolver,
    privateResolverForBuyer
} from "../../../utils/resolverFuncWrapper";
import { ItemModel, ItemCls } from "../../../models/Item/Item";
import { ApolloError } from "apollo-server";
import { ERROR_CODES } from "../../../types/values";
import { ProductModel, ProductCls } from "../../../models/Product/Product";
import { ObjectId } from "mongodb";
import { ONE_MINUTE, ONE_DAY, ONE_HOUR } from "../../../utils/dateFuncs";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";
import { BuyerModel, BuyerCls } from "../../../models/Buyer";
import { SmsManager } from "../../../models/Sms/SmsManager/SmsManager";
import { UserModel } from "../../../models/User";
import { StoreModel } from "../../../models/Store/Store";
import { CustomFieldCls } from "../../../types/types";

const resolvers: Resolvers = {
    Mutation: {
        CreateItemForBuyer: defaultResolver(
            privateResolverForBuyer(
                async (
                    { args, context: { req } },
                    stack: any[]
                ): Promise<CreateItemForBuyerResponse> => {
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const { cognitoBuyer } = req;
                        const {
                            param
                        }: { param: CreateItemForBuyerInput } = args;
                        const buyer = await BuyerModel.findBuyer(cognitoBuyer);
                        const product = await ProductModel.findByCode(
                            param.productCode
                        );
                        const dateTimeRange = param.dateTimeRange;
                        if (!dateTimeRange) {
                            throw new ApolloError(
                                "날짜 범위를 선택해 주세요",
                                "PARAMETER_ERROR_DATETIMERANGE"
                            );
                        }

                        // Item 생성
                        const item = await createItem(product, buyer, param);

                        // Item Validation ㄱㄱ
                        await validateDateTimerange(product, dateTimeRange);

                        // Item 저장하기
                        // TODO: 동작하는지 확인 ㄱㄱ
                        await Promise.all([
                            item
                                .applyStatus(
                                    product.needToConfirm
                                        ? "PENDING"
                                        : "PERMITTED",
                                    {
                                        workerId: product.needToConfirm
                                            ? item.buyerId
                                            : product.userId
                                        // comment
                                    }
                                )
                                .save({ session }),
                            item.save({ session })
                        ]);

                        // smsKey 확인
                        // if exist => sms 전송 ㄱㄱ
                        const smsKey = await getSmsKey(product.userId);
                        if (smsKey) {
                            // 해당 시간에 예약이 가능한지 확인해야됨 ㅎ
                            const smsAttributes: SmsFormatAttribute[] = createSmsFormatAttrs(
                                {
                                    buyerName: buyer.name,
                                    prodcutName: product.name,
                                    from: new Date(
                                        item.dateTimeRange.from.getTime() +
                                            buyer.zoneinfo.offset * ONE_HOUR
                                    ),
                                    to: new Date(
                                        item.dateTimeRange.to.getTime() +
                                            buyer.zoneinfo.offset * ONE_HOUR
                                    )
                                }
                            );
                            await sendSmsWithTrigger({
                                key: smsKey,
                                formatAttributes: smsAttributes,
                                receivers: [buyer.phone_number],
                                stack
                            });
                        }

                        await session.commitTransaction();
                        session.endSession();
                        return {
                            ok: true,
                            error: null,
                            data: item as any
                        };
                    } catch (error) {
                        return await errorReturn(error, session);
                    }
                }
            )
        )
    }
};

const createItem = async (
    product: DocumentType<ProductCls>,
    buyer: DocumentType<BuyerCls>,
    param: CreateItemForBuyerInput
): Promise<DocumentType<ItemCls>> => {
    const item = new ItemModel();
    if (param.dateTimeRange) {
        const { from, to } = param.dateTimeRange;
        item.dateTimeRange = {
            from,
            to,
            interval: Math.floor((to.getTime() - from.getTime()) / ONE_MINUTE)
        };
    }
    const store = await StoreModel.findById(product.storeId);
    if (!store) {
        throw new ApolloError(
            "존재하지 않는 Store입니다(내부DB 에러)",
            ERROR_CODES.UNEXIST_STORE
        );
    }
    const customFieldDef = store.customFields;
    setParamsToItem(param, item, buyer, customFieldDef);

    item.productId = product._id;
    item.storeId = product.storeId;
    item.buyerId = new ObjectId(buyer._id);
    await item.setCode(product.code, new Date());
    return item;
};

const getSmsKey = async (userId: ObjectId): Promise<ObjectId | undefined> => {
    const seller = await UserModel.findById(userId);
    if (!seller) {
        throw new ApolloError(
            "존재하지 않는 UserId",
            ERROR_CODES.UNEXIST_USER,
            {
                errorInfo: "Product객체에 UserId 에러임"
            }
        );
    }
    return seller.smsKey;
};

const createSmsFormatAttrs = ({
    buyerName,
    from,
    prodcutName,
    to
}: {
    buyerName: string;
    prodcutName: string;
    from: Date;
    to: Date;
}) => {
    return [
        {
            key: "NAME",
            value: buyerName
        },
        {
            key: "PRODUCT_NAME",
            value: prodcutName
        },
        {
            key: "FROM",
            value: from
                .toISOString()
                .split("T")[1]
                .substr(0, 5)
        },
        {
            key: "TO",
            value: to
                .toISOString()
                .split("T")[1]
                .substr(0, 5)
        },
        {
            key: "DATE",
            value: from.toISOString().split("T")[0]
        }
    ];
};

const sendSmsWithTrigger = async ({
    formatAttributes,
    key,
    receivers,
    stack
}: {
    key: ObjectId;
    stack: any[];
    formatAttributes: SmsFormatAttribute[];
    receivers: string[];
}) => {
    stack.push(
        { key },
        {
            formatAttributes
        }
    );
    const smsManager = new SmsManager(key);
    await smsManager.sendWithTrigger({
        event: "ON_BOOKING_SUBMITTED",
        formatAttributes,
        receivers
    });
};

const setParamsToItem = async (
    param: CreateItemForBuyerInput,
    item: DocumentType<ItemCls>,
    buyer: DocumentType<BuyerCls>,
    customFieldDef: CustomFieldCls[]
) => {
    // customField 확인 ㄱ
    const customFieldValues = param.customFieldValues;

    const findField = (
        fields: CustomFieldCls[],
        key: ObjectId
    ): CustomFieldCls | undefined => {
        return fields.find(f => f.key.equals(key));
    };
    for (const fieldName in param) {
        if (fieldName === "customFieldValues") {
            item[fieldName] = customFieldValues
                .map(f => {
                    const ff = findField(customFieldDef, new ObjectId(f.key));
                    if (!ff) {
                        return undefined;
                    }
                    return {
                        key: new ObjectId(f.key),
                        label: ff.label,
                        type: ff.type,
                        value: f.value
                    };
                })
                .filter(t => t) as any;
        }
        const element = param[fieldName];
        item[fieldName] = element;
    }
    if (!item.name) {
        item.name = buyer.name;
    }
    if (!item.phoneNumber) {
        item.phoneNumber = buyer.phone_number;
    }
};

const validateDateTimerange = async (
    product: DocumentType<ProductCls>,
    dateTimeRange: DateTimeRangeInput
) => {
    if (dateTimeRange) {
        const dtRangeCls = new DateTimeRangeCls(dateTimeRange);
        const list = await product.getSegmentSchedules(dtRangeCls);
        if (list.length === 0) {
            throw new ApolloError(
                "이용 가능한 시간이 아닙니다.",
                ERROR_CODES.UNAVAILABLE_BUSINESSHOURS
            );
        }

        // TODO: 여기서 걸러내자...
        const now = new Date();
        const interval = (dtRangeCls.from.getTime() - now.getTime()) / ONE_DAY;
        if (
            product.bookingPolicy.limitFirstBooking > interval &&
            product.bookingPolicy.limitLastBooking < interval
        ) {
            throw new ApolloError(
                "예약 가능범위에 포함되지 않는 날짜입니다",
                ERROR_CODES.UNINCLUDED_BOOKING_DATERANGE
            );
        }

        const isAvailable = list.map(l => !l.soldOut).filter(t => t).length;
        if (!isAvailable) {
            throw new ApolloError(
                "SoldOut인 Segment가 존재합니다.",
                ERROR_CODES.UNAVAILABLE_SOLD_OUT,
                {
                    segment: list
                }
            );
        }
    }
};

export default resolvers;
