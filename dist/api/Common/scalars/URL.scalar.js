"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function serialize(val) {
    const regExp = /^http(s)?:\/\/(www\.)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    const validation = regExp.test(val);
    if (!validation) {
        throw new Error("Invalid URL");
    }
    return regExp.test(val) ? val : null;
}
function parseValue(value) {
    return serialize(value);
}
function parseLiteral(ast) {
    return ast.kind === language_1.Kind.STRING ? parseValue(ast.value) : null;
}
exports.default = new graphql_1.GraphQLScalarType({
    name: "URL",
    description: "URL 타입 스칼라 검증. ",
    serialize,
    parseValue,
    parseLiteral
});
//# sourceMappingURL=URL.scalar.js.map