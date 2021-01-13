"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function serialize(val) {
    // 특수문자 1개 이상 포함 & 7~15숫자, 영문 조합
    const regExp = /^(?=.*[0-9])(?=.*[!@#$%^&*_\-~;?/])[a-zA-Z0-9!@#$%^&*_\-~;?/]{7,15}$/gi;
    const validation = regExp.test(val);
    if (!validation) {
        throw new Error("Invalid Password");
    }
    return val;
}
function parseValue(value) {
    return serialize(value);
}
function parseLiteral(ast) {
    return ast.kind === language_1.Kind.STRING ? parseValue(ast.value) : null;
}
exports.default = new graphql_1.GraphQLScalarType({
    name: "Password",
    description: "특수문자 1개이상 포함, 7~15자리 숫자 & 영문",
    serialize,
    parseValue,
    parseLiteral
});
//# sourceMappingURL=Password.scalar.js.map