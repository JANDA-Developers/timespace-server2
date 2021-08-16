import { sendEmail } from "./utils/sesFunctions";


const main = async () => {
    const results = await sendEmail({html : "<div>인증번호 : 123456" +"</div>", summary : "인증코드", targets: ["jtk9669@gmail.com"]});
    console.log(results);
}

main();
