"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findStore = void 0;
const Store_1 = require("./Store");
exports.findStore = async (id) => {
    return Store_1.StoreModel.findById(id);
};
//# sourceMappingURL=storeFunctions.js.map