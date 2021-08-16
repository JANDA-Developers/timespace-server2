import axios from "axios";

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

const main = async () =>{
    await axios.post(
        "http://timespace-alb-1323994784.ap-northeast-2.elb.amazonaws.com",///process.env.URL,
        {
            query : query("01063484556", `회원가입 인증코드는 [${1111111111}] 입니다.`)  
        }
    )
}


main();