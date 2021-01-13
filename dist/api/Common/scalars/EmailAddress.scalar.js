"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function serialize(val) {
    const regExp = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const validation = regExp.test(val);
    if (!validation) {
        throw new Error("Invalid EmailAddress");
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
    name: "EmailAddress",
    description: `EmailAddress... 
    /^[-$^_=+0-9A-Za-z~]+@[-$%/0-9=?A-Z^_a-z~]+.[0-9A-Za-z~]+$/
    `,
    serialize,
    parseValue,
    parseLiteral
});
//# sourceMappingURL=EmailAddress.scalar.js.map