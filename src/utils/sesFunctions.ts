// import { SES as SESAWS } from "aws-sdk";

import { SES } from "aws-sdk";

interface ISendParams {
    targets:string[],
    html:string,
    summary:string,
    sender?: string,
}

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

const ses = new SES({
    region: process.env.AWS_SES_REGION || "us-east-1",
});


export const sendEmail = async ({html,summary,targets,sender}:ISendParams) => {
    return await ses
    .sendEmail({
        Source:  sender || "no-reply@stayjanda.com",
        Destination: {
            ToAddresses: targets,
        },
        Message: {
            Body: {
                Html: {
                    Data:
                        html,
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
}
