"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFilesForCustomField = void 0;
const mongodb_1 = require("mongodb");
const s3Funcs_1 = require("../../../utils/s3Funcs");
exports.saveFilesForCustomField = async (userSub, customFields) => {
    const baseDir = `${userSub}/cf/`;
    const result = await Promise.all(customFields.map(async (cf) => {
        const field = {
            ...cf,
            fileUrl: null,
            key: new mongodb_1.ObjectId(),
            isMandatory: cf.isMandatory || false
        };
        if (cf.type === "FILE" && cf.file) {
            const syncedFile = await cf.file;
            const { url } = await s3Funcs_1.uploadFile(syncedFile, {
                dir: baseDir
            });
            field.fileUrl = url;
        }
        return field;
    }));
    return result;
};
//# sourceMappingURL=SaveFileForCustomField.js.map