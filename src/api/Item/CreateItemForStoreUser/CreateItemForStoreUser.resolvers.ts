import { ApolloError } from "apollo-server";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    CreateItemForStoreUserResponse,
    CreateItemForStoreUserMutationArgs,
    CreateItemForStoreUserInput,
    DateTimeRangeInput,
    CustomFieldInput,
    SmsTriggerEvent
} from "GraphType";
import {
    defaultResolver,
    privateResolverForStoreUser
} from "../../../utils/resolverFuncWrapper";
import { ERROR_CODES } from "../../../types/values";
import { StoreUserCls } from "../../../models/StoreUser";
import { ClientSession } from "mongoose";
import { ItemCls, ItemModel } from "../../../models/Item/Item";
import { ProductModel, ProductCls } from "../../../models/Product/Product";
import { DateTimeRangeCls } from "../../../utils/DateTimeRange";
import { ONE_DAY, ONE_MINUTE } from "../../../utils/dateFuncs";
import { CustomFieldCls } from "../../../types/types";
import { ObjectId } from "mongodb";
import { uploadFile } from "../../../utils/s3Funcs";
import { StoreModel } from "../../../models/Store/Store";
import { UserModel } from "../../../models/User";
import {
    SendSmsWithTriggerEvent,
    getReplacementSetsForItem
} from "../../../models/Item/ItemFunctions";
import { createTransaction } from "../../../models/Transaction/transactionFuncs";
import { TransactionCls } from "../../../models/Transaction/Transaction";

export const CreateItemForStoreUserFunc = async ({
    args,
    context: { req }
}): Promise<CreateItemForStoreUserResponse> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { storeUser }: { storeUser: DocumentType<StoreUserCls> } = req;
        const {
            dateTimeRange,
            productCode,
            usersInput
        } = args as CreateItemForStoreUserMutationArgs;

        // TODO: 1. 아이템 생성

        // product = undefined 인 경우 에러나면서 종료됨.
        const product = await ProductModel.findByCode(productCode);

        await validateDateTimeRange(product, dateTimeRange);

        const item = await createItem(
            storeUser,
            product,
            dateTimeRange,
            usersInput,
            session
        );

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
};

const createItem = async (
    storeUser: DocumentType<StoreUserCls>,
    product: DocumentType<ProductCls>,
    dateTimeRange: DateTimeRangeInput,
    usersInput: CreateItemForStoreUserInput,
    session?: ClientSession
): Promise<DocumentType<ItemCls>> => {
    if (!usersInput.privacyPolicyAgreement) {
        throw new ApolloError(
            "개인정보 활용동의 체크 필수",
            ERROR_CODES.INVALID_VALUES
        );
    }
    const item = new ItemModel();
    item.productId = product._id;
    item.name = usersInput.name || storeUser.name;
    item.phoneNumber = usersInput.phoneNumber || storeUser.phoneNumber;
    item.storeId = product.storeId;
    item.storeUserId = storeUser._id;
    // set DateTimeRange
    const { from, to } = dateTimeRange;
    item.dateTimeRange = {
        from,
        to,
        interval: Math.floor((to.getTime() - from.getTime()) / ONE_MINUTE)
    };

    // await item.setStatusForDefault();
    const store = await StoreModel.findById(product.storeId);
    if (!store) {
        throw new Error("존재하지 않는 Store");
    }
    // HACK: 오류있을 가능성 오짐.
    item.customFieldValues = (await getItemsCustomFieldValues({
        customFields: usersInput.customFieldValues,
        customFieldDef: store.customFields,
        itemCode: item.code
    })) as any;

    await item.setCode(product.code, new Date());

    await item
        .applyStatus(product.needToConfirm ? "PENDING" : "PERMITTED", {})
        .save({ session });

    if (
        product.usingPayment &&
        (product.segmentPrice != 0 || product.defaultPrice != 0)
    ) {
        const transaction = setTransaction({
            product,
            item,
            storeUser
        });

        await transaction.save({ session });
        console.log({ transaction, _id: transaction._id });

        item.transactionId = transaction._id;
    }
    // SMS 전송 ㄱㄱㄱ
    await SendSmsForStoreUser(product, item);

    await item.save({ session });
    return item;
};

const setTransaction = ({
    product,
    item,
    storeUser
}: {
    item: DocumentType<ItemCls>;
    product: DocumentType<ProductCls>;
    storeUser: DocumentType<StoreUserCls>;
}): DocumentType<TransactionCls> => {
    const {
        defaultPrice,
        segmentPrice,
        periodOption: { unit }
    } = product;
    const {
        dateTimeRange: { interval }
    } = item;

    // 아이템 수량
    const itemCount = Math.floor(interval / unit);
    const defaultCount = Math.floor(product.periodOption.min / unit);
    const additionalCount = itemCount - defaultCount;
    // 최종 아이템 가격
    const amount =
        defaultCount * (defaultPrice || segmentPrice) +
        additionalCount * segmentPrice;
    const transaction = createTransaction({
        amount,
        paymethod: "CARD",
        productInfo: {
            target: "PRODUCT",
            payload: item._id
        },
        sellerId: product.userId,
        storeId: product.storeId,
        storeUserId: storeUser._id
    });
    return transaction;
};

const getItemsCustomFieldValues = async ({
    customFields,
    itemCode,
    customFieldDef
}: {
    customFields?: CustomFieldInput[];
    customFieldDef?: CustomFieldCls[];
    itemCode: string;
}) => {
    const findField = (
        fields: CustomFieldCls[],
        key: ObjectId
    ): CustomFieldCls | undefined => {
        return fields.find(f => f.key.equals(key));
    };
    if (!customFieldDef) {
        return [];
    }
    if (!customFields) {
        const haveMandatoryField =
            customFieldDef.map(def => def.isMandatory).filter(t => t).length >
            0;
        if (haveMandatoryField) {
            throw new ApolloError(
                "필수 사용자 정의 필드가 입력되지 않았습니다.",
                ERROR_CODES.INVALID_VALUES
            );
        }
        return [];
    }
    const result = await Promise.all(
        customFields.map(async f => {
            const ff = findField(customFieldDef, new ObjectId(f.key));
            if (!ff) {
                return undefined;
            }
            let url: string = "";
            if (f.file) {
                const file = await f.file;
                url = (
                    await uploadFile(file, {
                        dir: `buyer/${itemCode}`
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
    );
    return result;
};

const validateDateTimeRange = async (
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

const SendSmsForStoreUser = async (
    product: DocumentType<ProductCls>,
    item: DocumentType<ItemCls>
) => {
    const smsKey = (await UserModel.findById(product.userId))?.smsKey;
    // trigger검색: Event & tags 검색(storeId)
    if (smsKey && item.phoneNumber) {
        // Send for buyer
        const tags = [
            {
                key: "storeId",
                value: item.storeId.toHexString()
            }
        ];
        const store = await StoreModel.findById(item.storeId);
        if (!store) {
            throw new ApolloError(
                "존재하지 않는 StoreId입니다...",
                ERROR_CODES.UNEXIST_STORE
            );
        }
        const event: SmsTriggerEvent = "ITEM_CREATED";

        const eventForSeller: SmsTriggerEvent = "ITEM_CREATED_FOR_SELLER";

        const myObject = await getReplacementSetsForItem(item);

        // SMS 전송 => Buyer에게 전송
        await SendSmsWithTriggerEvent({
            smsKey,
            event,
            tags,
            recWithReplSets: [
                {
                    receivers: [
                        // 국가코드 제거하자 ㅜㅜ
                        item.phoneNumber.replace("+82", "")
                    ],
                    replacementSets: myObject
                }
            ]
        });

        if (store.manager.phoneNumber) {
            await SendSmsWithTriggerEvent({
                smsKey,
                event: eventForSeller,
                tags,
                recWithReplSets: [
                    {
                        receivers: [
                            store.manager.phoneNumber.replace("+82", "")
                        ],
                        replacementSets: myObject
                    }
                ]
            });
        }
    }
};

const resolvers: Resolvers = {
    Mutation: {
        CreateItemForStoreUser: defaultResolver(
            privateResolverForStoreUser(CreateItemForStoreUserFunc)
        )
    }
};
export default resolvers;
