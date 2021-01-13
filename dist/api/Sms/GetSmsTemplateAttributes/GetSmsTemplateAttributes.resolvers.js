// import { ApolloError } from "apollo-server";
// import { mongoose } from "@typegoose/typegoose";
// import { errorReturn } from "../../../utils/utils";
// import { Resolvers } from "../../../types/resolvers";
// import {
//     GetSmsTemplateAttributesResponse,
//     GetSmsTemplateAttributesQueryArgs
// } from "GraphType";
// import {
//     defaultResolver,
//     privateResolver
// } from "../../../utils/resolverFuncWrapper";
// import { ERROR_CODES } from "../../../types/values";
// import { ItemModel } from "../../../models/Item/Item";
// import { UserModel } from "../../../models/User";
// export const GetSmsTemplateAttributesFunc = async (
//     { parent, info, args, context: { req } },
//     stack: any[]
// ): Promise<GetSmsTemplateAttributesResponse> => {
//     try {
//         const { cognitoUser } = req;
//         const user = await UserModel.findUser(cognitoUser);
//         const { itemId }: GetSmsTemplateAttributesQueryArgs = args;
//         const item = await ItemModel.findById(itemId);
//         if (!item) {
//             throw new ApolloError(
//                 "존재하지 않는 ItemId 입니다",
//                 ERROR_CODES.UNEXIST_ITEM
//             );
//         }
//         throw new ApolloError("개발중", ERROR_CODES.UNDERDEVELOPMENT);
//     } catch (error) {
//         const errResponse = await errorReturn(error);
//         return {
//             ...errResponse,
//             data: []
//         };
//     }
// };
// const resolvers: Resolvers = {
//     Query: {
//         GetSmsTemplateAttributes: defaultResolver(
//             privateResolver(GetSmsTemplateAttributesFunc)
//         )
//     }
// };
// export default resolvers;
//# sourceMappingURL=GetSmsTemplateAttributes.resolvers.js.map