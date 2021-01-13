"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
const json5_1 = __importDefault(require("json5"));
exports.default = new graphql_1.GraphQLScalarType({
    name: "Object",
    description: "Represents an arbitrary object.",
    parseValue: toObject,
    serialize: toObject,
    parseLiteral(ast) {
        switch (ast.kind) {
            case language_1.Kind.STRING:
                return ast.value.charAt(0) === "{"
                    ? json5_1.default.parse(ast.value)
                    : null;
            case language_1.Kind.OBJECT:
                return parseObject(ast);
        }
        return null;
    }
});
function toObject(value) {
    if (typeof value === "object") {
        return value;
    }
    if (typeof value === "string" && value.charAt(0) === "{") {
        return json5_1.default.parse(value);
    }
    return null;
}
function parseObject(ast) {
    const value = Object.create(null);
    ast.fields.forEach(field => {
        value[field.name.value] = parseAst(field.value);
    });
    return value;
}
function parseAst(ast) {
    switch (ast.kind) {
        case language_1.Kind.STRING:
        case language_1.Kind.BOOLEAN:
            return ast.value;
        case language_1.Kind.INT:
        case language_1.Kind.FLOAT:
            return parseFloat(ast.value);
        case language_1.Kind.OBJECT:
            return parseObject(ast);
        case language_1.Kind.LIST:
            return ast.values.map(parseAst);
        default:
            return null;
    }
}
//# sourceMappingURL=Object.scalar.js.map