// import { ApolloError } from "apollo-server";
// import { mongoose } from "@typegoose/typegoose";
// import { errorReturn } from "../../../utils/utils";
// import { Resolvers } from "../../../types/resolvers";
// import {
//     PermitItemAndCancelOthersResponse,
//     PermitItemAndCancelOthersMutationArgs
// } from "GraphType";
// import {
//     defaultResolver,
//     privateResolver
// } from "../../../utils/resolverFuncWrapper";
// import { ERROR_CODES } from "../../../types/values";

// export const PermitItemAndCancelOthersFunc = async (
//     { parent, info, args, context: { req } },
//     stack: any[]
// ): Promise<PermitItemAndCancelOthersResponse> => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     try {
//         const { cognitoUser } = req;
//         const {
//             itemId,
//             comment
//         } = args as PermitItemAndCancelOthersMutationArgs;
//         /**
//          * ============================================================
//          *
//          * Your Code Here~!
//          *
//          * ============================================================
//          */
//         await session.commitTransaction();
//         session.endSession();
//         return {
//             ok: true,
//             error: null,
//             data: {
//                 permittedItem: {} as any,
//                 canceledItem: []
//             }
//         };
//     } catch (error) {
//         return await errorReturn(error, session);
//     }
// };

// const resolvers: Resolvers = {
//     Mutation: {
//         PermitItemAndCancelOthers: defaultResolver(
//             privateResolver(PermitItemAndCancelOthersFunc)
//         )
//     }
// };
// export default resolvers;
