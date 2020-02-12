import { mongoose } from "@typegoose/typegoose";
import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetStoreGroupByCodeResponse,
    GetStoreGroupByCodeInput
} from "../../../types/graph";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { ProductGroupModel } from "../../../models/ProductGroupCls";

const resolvers: Resolvers = {
    Query: {
        GetStoreGroupByCode: defaultResolver(
            async ({
                args: { param }
            }): Promise<GetStoreGroupByCodeResponse> => {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const { groupCode } = param as GetStoreGroupByCodeInput;
                    const group = await ProductGroupModel.findByCode(groupCode);
                    return {
                        ok: true,
                        error: null,
                        data: group as any
                    };
                } catch (error) {
                    return await errorReturn(error, session);
                }
            }
        )
    }
};
export default resolvers;
