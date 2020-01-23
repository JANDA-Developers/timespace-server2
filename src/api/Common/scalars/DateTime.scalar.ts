import { GraphQLScalarType } from "graphql";
import { ASTNode, Kind } from "graphql/language";

function serialize(value: string): Date | null {
    const date = new Date(value);
    return date;
}

function parseValue(value: string | Date): string | null {
    const date = new Date(value);
    date.setUTCHours(0, 0, 0, 0);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid Date Value");
    }
    return date.toISOString();
}

function parseLiteral(ast: ASTNode): string | null {
    switch (ast.kind) {
        case Kind.STRING:
        case Kind.INT:
            return parseValue(ast.value);
        default:
            return null;
    }
}

export default new GraphQLScalarType({
    name: "DateTime",
    description: "JavaScript Date object as an ISO timestamp",
    serialize,
    parseValue,
    parseLiteral
});
