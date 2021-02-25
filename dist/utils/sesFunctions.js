"use strict";
// import { SES as SESAWS } from "aws-sdk";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const aws_sdk_1 = require("aws-sdk");
// export class MYSES extends SESAWS {
//     constructor (args?: SESAWS.Types.ClientConfiguration){
//         super(args)
//     }
//     public async send(params:ISendParams) {
//         const {targets,html,smmary,sender} = params;
//         // await super.sendEmail({
//             Source: sender ||"no-reply@stayjanda.com",
//             Destination: {
//                 ToAddresses: targets,
//             },
//             Message: {
//                 Body: {
//                     Html: {
//                         Data: html,
//                         Charset: "UTF-8",
//                     },
//                 },
//                 Subject: {
//                     Data: smmary,
//                     Charset: "UTF-8",
//                 },
//             },
//         }).promise()
//     }
// }
const ses = new aws_sdk_1.SES({
    region: process.env.AWS_SES_REGION || "us-east-1",
});
exports.sendEmail = async ({ html, summary, targets, sender }) => {
    return await ses
        .sendEmail({
        Source: sender || "no-reply@stayjanda.com",
        Destination: {
            ToAddresses: targets,
        },
        Message: {
            Body: {
                Html: {
                    Data: html,
                    Charset: "UTF-8",
                },
            },
            Subject: {
                Data: summary,
                Charset: "UTF-8",
            },
        },
    })
        .promise();
};
//# sourceMappingURL=sesFunctions.js.map