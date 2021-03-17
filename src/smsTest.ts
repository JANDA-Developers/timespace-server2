
import axios from "axios"

const main= async () => {
    await makeHeadRequest();
    //"https://kbsjl5pnsi.execute-api.ap-northeast-2.amazonaws.com/sms/sms/send/mass"
    //"https://e1lsuymlf4.execute-api.ap-northeast-2.amazonaws.com/dev"
        axios.post(
            //"https://kbsjl5pnsi.execute-api.ap-northeast-2.api.stayjanda.cloud/sms/sms/send/mass", 
        "https://kbsjl5pnsi.execute-api.ap-northeast-2.amazonaws.com/sms/sms/send/mass",    
        //"https://e1lsuymlf4.execute-api.ap-northeast-2.amazonaws.com/dev/sms/send/mass",
        {
            cnt: 1,
            recMsgs: [
                {
                    receiver: '01063484556', //01020600103
                    message: '김민재 컨퍼런스룸1(대회의실) 2021-02-21 10:30 ~ 11:30 예약 신청이 접수되었습니다. '
                }
            ],
            msg_type: 'LMS',
            sender: '01020600103' //01020600103
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    ).then((response) => {
        console.log(response);
    }).catch((error)=> {
        console.log(error);
    })


      
 
}

main()
async function makeHeadRequest() {

    let res = await axios.head('http://webcode.me');
  
    console.log(`Status: ${res.status}`)
    console.log(`Server: ${res.headers.server}`)
    console.log(`Date: ${res.headers.date}`)
  }
// https://kbsjl5pnsi.execute-api.ap-northeast-2.amazonaws.com/sms/sms/send/mass
// {
//   cnt: 1,
//   recMsgs: [
//     {
//       receiver: '01020600103',
//       message: '김민재 컨퍼런스룸1(대회의실) 2021-02-21 10:30 ~ 11:30 예약 신청이 접수되었습니다. '
//     }
//   ],
//   msg_type: 'LMS',
//   sender: '01020600103'
// }
// { headers: { 'Content-Type': 'application/json' } }