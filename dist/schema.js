"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const merge_graphql_schemas_1 = require("merge-graphql-schemas");
const path_1 = __importDefault(require("path"));
const scalars = __importStar(require("./api/Common/scalars/scalars"));
const graphql_tools_1 = require("graphql-tools");
const graphql_upload_1 = require("graphql-upload");
// 파일 트리를 전부 타고 들어가서 병합하는 로직을 만들어야 함.
const allTypes = merge_graphql_schemas_1.fileLoader(path_1.default.join(__dirname, "./api/**/*.graphql"));
const allResolvers = merge_graphql_schemas_1.fileLoader(path_1.default.join(__dirname, "./api/**/*.resolvers.*"));
const mergedTypes = merge_graphql_schemas_1.mergeTypes(allTypes);
const mergedResolvers = merge_graphql_schemas_1.mergeResolvers(allResolvers);
const schema = graphql_tools_1.makeExecutableSchema({
    typeDefs: mergedTypes,
    resolvers: {
        ...mergedResolvers,
        ...scalars,
        Upload: graphql_upload_1.GraphQLUpload
    }
});
exports.default = schema;
//# sourceMappingURL=schema.js.map