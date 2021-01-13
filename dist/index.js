"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: "../.env"
});
const app_1 = __importDefault(require("./app"));
const typegoose_1 = require("@typegoose/typegoose");
const values_1 = require("./types/values");
const port = parseInt(process.env.PORT || "4000");
// const dbUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
typegoose_1.mongoose
    .connect(process.env.DB_URI || values_1.DB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})
    .then(() => {
    app_1.default.listen({ port }, () => {
        console.log(`DB Connection: ${values_1.DB_URI}`);
        console.log(`server listening at: http://${process.env.SERVER_URL}:${port}${process.env.GRAPHQL_ENDPOINT}`);
    });
})
    .catch(err => {
    console.log(err);
});
//# sourceMappingURL=index.js.map