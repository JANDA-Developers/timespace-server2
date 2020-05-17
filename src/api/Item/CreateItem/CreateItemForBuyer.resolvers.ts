import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CreateItemForBuyerResponse,
    CreateItemForBuyerInput,
    DateTimeRangeInput,
    SmsTriggerEvent
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
import { ONE_MINUTE, ONE_DAY } from "../../../utils/dateFuncs";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";
import { BuyerModel, BuyerCls } from "../../../models/Buyer";
import { StoreModel } from "../../../models/Store/Store";
import { CustomFieldCls } from "../../../types/types";
import { uploadFile } from "../../../utils/s3Funcs";
import {
    getReplacementSetsForItem,
    SendSmsWithTriggerEvent
} from "../../../models/Item/ItemFunctions";
import { UserModel } from "../../../models/User";

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
                        const item = await createItem(
                            product,
                            buyer,
                            param,
                            stack
                        );

                        // Item Validation ㄱㄱ
                        await validateDateTimerange(product, dateTimeRange);

                        // Item 저장하기
                        // TODO: 동작하는지 확인 ㄱㄱ
                        await Promise.all([
                            // ChangeHistory 저장하는거임. Item저장 아님.
                            await item
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
                            await item.save({ session })
                        ]);

                        const smsKey = (
                            await UserModel.findById(product.userId).session(
                                session
                            )
                        )?.smsKey;
                        // trigger검색: Event & tags 검색(storeId)
                        if (smsKey && item.phoneNumber) {
                            // Send for buyer
                            const tags = [
                                {
                                    key: "storeId",
                                    value: item.storeId.toHexString()
                                }
                            ];
                            const event: SmsTriggerEvent =
                                "ITEM_CREATED_PENDING";

                            // SMS 전송
                            await SendSmsWithTriggerEvent({
                                smsKey,
                                event,
                                tags,
                                recWithReplSets: [
                                    {
                                        receivers: [item.phoneNumber],
                                        replacementSets: await getReplacementSetsForItem(
                                            item
                                        )
                                    }
                                ]
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
    param: CreateItemForBuyerInput,
    stack: any[]
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

    const { max, min } = store.periodOption;
    const overMax = item.dateTimeRange.interval > max;
    const lowerMin = item.dateTimeRange.interval < min;
    if (overMax || lowerMin) {
        throw new ApolloError(
            `${min}~${max}분 이내의 시간을 선택해 주세요`,
            ERROR_CODES.ITEM_VALIDATION_ERROR
        );
    }

    item.productId = product._id;
    item.storeId = product.storeId;
    item.buyerId = new ObjectId(buyer._id);
    await item.setCode(product.code, new Date());

    const customFieldDef = store.customFields;
    await setParamsToItem(param, item, buyer, customFieldDef);

    return item;
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
            item[fieldName] = (
                await Promise.all(
                    customFieldValues.map(async f => {
                        const ff = findField(
                            customFieldDef,
                            new ObjectId(f.key)
                        );
                        if (!ff) {
                            return undefined;
                        }
                        let url: string = "";
                        if (f.file) {
                            const file = await f.file;
                            url = (
                                await uploadFile(file, {
                                    dir: `buyer/${item.code}`
                                })
                            ).url;
                        }
                        return {
                            key: new ObjectId(f.key),
                            label: ff.label,
                            type: ff.type,
                            value: f.value || url
                        };
                    })
                )
            ).filter(t => t) as any;
        } else {
            const element = param[fieldName];
            item[fieldName] = element;
        }
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
