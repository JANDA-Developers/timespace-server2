"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendConfirmationCodeFunc = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const utils_1 = require("../../../utils/utils");
const resolverFuncWrapper_1 = require("../../../utils/resolverFuncWrapper");
const aws_sdk_1 = require("aws-sdk");
exports.ResendConfirmationCodeFunc = async ({ parent, info, args, context: { req } }, stack) => {
    const session = await typegoose_1.mongoose.startSession();
    session.startTransaction();
    try {
        const { username, clientId } = args;
        const cognito = new aws_sdk_1.CognitoIdentityServiceProvider();
        // TODO: 문자 보내야됨!
        const result = await cognito
            .resendConfirmationCode({
            ClientId: clientId,
            Username: username
        })
            .promise();
        console.log({
            resendResult: result.CodeDeliveryDetails
        });
        await session.commitTransaction();
        session.endSession();
        return {
            ok: true,
            error: null
        };
    }
    catch (error) {
        return await utils_1.errorReturn(error, session);
    }
};
const resolvers = {
    Mutation: {
        ResendConfirmationCode: resolverFuncWrapper_1.defaultResolver(exports.ResendConfirmationCodeFunc)
    }
};
exports.default = resolvers;
//# sourceMappingURL=ResendConfirmationCode.resolvers.js.map