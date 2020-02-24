import { errorReturn } from "../../../utils/utils";
import { Resolvers } from "../../../types/resolvers";
import {
    GetStoreGroupByCodeResponse,
    GetStoreGroupByCodeInput
} from "GraphType";
import { defaultResolver } from "../../../utils/resolverFuncWrapper";
import { StoreGroupModel } from "../../../models/StoreGroup";

const resolvers: Resolvers = {
    Query: {
        GetStoreGroupByCode: defaultResolver(
            async ({
                args: { param }
            }): Promise<GetStoreGroupByCodeResponse> => {
                try {
                    const { groupCode } = param as GetStoreGroupByCodeInput;
                    const group = await StoreGroupModel.findByCode(groupCode);
                    return {
                        ok: true,
                        error: null,
                        data: group as any
                    };
                } catch (error) {
                    return await errorReturn(error);
                }
            }
        )
    }
};
export default resolvers;
