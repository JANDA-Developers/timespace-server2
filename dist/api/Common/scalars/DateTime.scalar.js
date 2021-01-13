"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function serialize(value) {
    const date = new Date(value);
    return date;
}
function parseValue(value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid Date Value");
    }
    return date;
}
function parseLiteral(ast) {
    switch (ast.kind) {
        case language_1.Kind.STRING: {
            const d = new Date(ast.value);
            if (d.toString() === "Invalid Date") {
                return new Date(parseInt(ast.value));
            }
            return d;
        }
        case language_1.Kind.INT:
            return new Date(parseInt(ast.value));
        default:
            return null;
    }
}
exports.default = new graphql_1.GraphQLScalarType({
    name: "DateTime",
    description: "JavaScript Date object as an ISO timestamp",
    serialize,
    parseValue,
    parseLiteral
});
//# sourceMappingURL=DateTime.scalar.js.map