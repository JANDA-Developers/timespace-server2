import { GraphQLScalarType } from "graphql";
import { ASTNode, Kind } from "graphql/language";

function serialize(value: string | number): Date | null {
    console.log({
        dateValue: value
    });
    const date = new Date(value);
    return date;
}

function parseValue(value: number | Date): string | null {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid Date Value");
    }
    return date.toISOString();
}

function parseLiteral(ast: ASTNode): Date | null {
    switch (ast.kind) {
        case Kind.STRING:
            return new Date(ast.value);
        case Kind.INT:
            return new Date(parseInt(ast.value));
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
