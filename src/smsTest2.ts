
import axios from "axios"

const main = async () => {
    let receivers = "01063484556"
    let msg = "문자테스트입니다!!!!!";
    const query = (receivers : string, msg : string) => {
        return `mutation {
            SendSMS(
                receivers : "${receivers}"
                msg : "${msg}"
            )
            {
                ok
            }
        }
        `
    }
    
    const {data} = await axios.post(
        "http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com/",
        {
            query : query(receivers, msg)  
        }
    )
    console.log(data);
}

main();
