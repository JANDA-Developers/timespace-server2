"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestApi = void 0;
const apollo_server_1 = require("apollo-server");
const axios_1 = __importDefault(require("axios"));
exports.requestApi = async (edge, query, variables, headers) => {
    const queryResult = await axios_1.default.post(edge, {
        query,
        variables
    }, {
        headers: {
            "Content-Type": "application/json",
            ...headers
        }
    });
    if (queryResult.status !== 200) {
        throw new apollo_server_1.ApolloError("Axios 통신 실패", "REQUEST_FAIL", queryResult.data);
    }
    const result = queryResult.data.data;
    return result;
};
//# sourceMappingURL=requestSmsApi.js.map