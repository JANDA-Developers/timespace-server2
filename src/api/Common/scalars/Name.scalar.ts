import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

function serialize(val: string): string | null {
    // const isIncludeSpecialChar = (str: string) => {
    //     return regExp.test(string);
    // };
    // const regExp = /[!@#$%^&*(),?"{}|<>]/g;
    // const regExp = /[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 .'_]+$/gi;
    // const maxLen = 40;
    // const validation = val.length <= maxLen && !regExp.test(val);
    // if (!validation) {
    //     throw new Error("Invalid Name");
    // }
    return val;
}

function parseValue(value: string): string | null {
    return serialize(value);
}

function parseLiteral(ast): string | null {
    return ast.kind === Kind.STRING ? parseValue(ast.value) : null;
}

export default new GraphQLScalarType({
    name: "Name",
    description: "이름. 특수문자 사용 불가 ('.', ''', 공백 만 사용 가능)",
    serialize,
    parseValue,
    parseLiteral
});
