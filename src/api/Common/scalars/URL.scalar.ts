import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

function serialize(val: string): string | null {
    const regExp = /^http(s)?:\/\/(www\.)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    const validation = regExp.test(val);
    if (!validation) {
        throw new Error("Invalid URL");
    }
    return regExp.test(val) ? val : null;
}

function parseValue(value: string): string | null {
    return serialize(value);
}

function parseLiteral(ast): string | null {
    return ast.kind === Kind.STRING ? parseValue(ast.value) : null;
}

export default new GraphQLScalarType({
    name: "URL",
    description: "URL 타입 스칼라 검증. ",
    serialize,
    parseValue,
    parseLiteral
});
