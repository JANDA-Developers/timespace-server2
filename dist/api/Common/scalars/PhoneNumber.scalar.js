"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function serialize(val) {
    const result = val.replace(/[\s-]+/g, "");
    const validation = /^[0-9+]+\w$/g.test(result);
    if (!validation) {
        throw new Error("Invalid PhoneNumber");
    }
    return result;
}
function parseValue(value) {
    return serialize(value);
}
function parseLiteral(ast) {
    return ast.kind === language_1.Kind.STRING ? parseValue(ast.value) : null;
}
exports.default = new graphql_1.GraphQLScalarType({
    name: "PhoneNumber",
    description: "전화번호임. 특수문자(+,-만 사용 가능), 문자열 수 14자 이하, 숫자 only",
    serialize,
    parseValue,
    parseLiteral
});
//# sourceMappingURL=PhoneNumber.scalar.js.map