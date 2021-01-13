"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function serialize(val) {
    // const isIncludeSpecialChar = (str: string) => {
    //     return regExp.test(string);
    // };
    // const regExp = /[!@#$%^&*(),?"{}|<>]/g;
    // const regExp = /[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 .'_]+$/gi;
    // const maxLen = 40;
    // const validation = val.length <= maxLen && !regExp.test(val);
    // if (!validation) {
    //     throw new Error("Invalid Name");
    // }
    return val;
}
function parseValue(value) {
    return serialize(value);
}
function parseLiteral(ast) {
    return ast.kind === language_1.Kind.STRING ? parseValue(ast.value) : null;
}
exports.default = new graphql_1.GraphQLScalarType({
    name: "Name",
    description: "이름. 특수문자 사용 불가 ('.', ''', 공백 만 사용 가능)",
    serialize,
    parseValue,
    parseLiteral
});
//# sourceMappingURL=Name.scalar.js.map