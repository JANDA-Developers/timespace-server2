import { CustomFieldDefineInput } from "GraphType";
import { CustomFieldCls } from "../../../types/types";
import { ObjectId } from "mongodb";
import { uploadFile } from "../../../utils/s3Funcs";

export const saveFilesForCustomField = async (
    userSub: string,
    customFields: CustomFieldDefineInput[]
): Promise<CustomFieldCls[]> => {
    const baseDir = `${userSub}/cf/`;
    const result: CustomFieldCls[] = await Promise.all(
        customFields.map(
            async (cf): Promise<CustomFieldCls> => {
                const field: CustomFieldCls = {
                    ...cf,
                    fileUrl: null,
                    key: new ObjectId(),
                    isMandatory: cf.isMandatory || false
                };
                if (cf.type === "FILE" && cf.file) {
                    const syncedFile = await cf.file;
                    const { url } = await uploadFile(syncedFile, {
                        dir: baseDir
                    });
                    field.fileUrl = url;
                }
                return field;
            }
        )
    );
    return result;
};
