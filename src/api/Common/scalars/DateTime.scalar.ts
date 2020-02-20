import { GraphQLScalarType } from "graphql";
import { ASTNode, Kind } from "graphql/language";

function serialize(value: string | number): Date | null {
    const date = new Date(value);
    return date;
}

function parseValue(value: number | Date) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid Date Value");
    }
    return date;
}

function parseLiteral(ast: ASTNode): Date | null {
    switch (ast.kind) {
        case Kind.STRING: {
            const d = new Date(ast.value);
            if (d.toString() === "Invalid Date") {
                return new Date(parseInt(ast.value));
            }
            return d;
        }
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
