"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sesFunctions_1 = require("./utils/sesFunctions");
const main = async () => {
    const results = await sesFunctions_1.sendEmail({ html: "<div>인증번호 : 123456" + "</div>", summary: "인증코드", targets: ["jtk9669@gmail.com"] });
    console.log(results);
};
main();
//# sourceMappingURL=emailTest.js.map