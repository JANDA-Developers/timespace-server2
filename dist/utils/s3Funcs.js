"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDir = exports.uploadFile = exports.makeDirPath = exports.bucketName = void 0;
const aws_sdk_1 = require("aws-sdk");
exports.bucketName = process.env.AWS_BUCKETNAME || "";
exports.makeDirPath = (dirPath) => {
    if (!dirPath) {
        return "";
    }
    return dirPath
        .split("/")
        .map(path => {
        return encodeURIComponent(path);
    })
        .filter(path => path.length !== 0)
        .join("/");
};
/**
 * 결과값으로 S3 URL 리턴함
 * 파일 이름 uuid로 랜덤 생성
 * @param file 업로드할 파일
 * @param dirName 업로드 디렉토리
 */
exports.uploadFile = async (file, { dir, tagSet }) => {
    // TODO: 여기서 업로드 하기 ㅎㅎ
    const tags = [
        {
            Key: "mimetype",
            Value: file.mimetype
        },
        {
            Key: "filename",
            Value: file.filename
        },
        ...(tagSet ? tagSet : [])
    ];
    const uploadPromise = new aws_sdk_1.S3.ManagedUpload({
        params: {
            ACL: "public-read",
            Bucket: exports.bucketName,
            Body: file.createReadStream(),
            Key: `${exports.makeDirPath(dir)}/${file.filename}`
        },
        tags
    }).promise();
    const url = await uploadPromise.then(data => {
        console.log("S3 Upload data ================================");
        console.log({
            data
        });
        return data.Location;
    }, err => {
        console.error(err);
        throw err;
    });
    return {
        url,
        mimeType: file.mimetype,
        filename: file.filename,
        tags
    };
};
exports.createDir = async (dirName) => {
    dirName = dirName.trim();
    if (!dirName) {
        throw new Error("디렉토리 이름이 존재하지 않음. ");
    }
    if (dirName.indexOf("/") !== -1) {
        throw new Error("디렉토리 이름에 '/' 포함 불가");
    }
    const albumKey = encodeURIComponent(dirName) + "/";
    const s3 = new aws_sdk_1.S3();
    s3.headObject({ Key: albumKey, Bucket: exports.bucketName }, function (err) {
        if (!err) {
            throw new Error("이미 존재하는 디렉토리");
        }
        if (err.code !== "NotFound") {
            throw err;
        }
        s3.putObject({ Key: albumKey, Bucket: exports.bucketName }, function (err) {
            if (err) {
                throw err;
            }
        });
    });
    return true;
};
//# sourceMappingURL=s3Funcs.js.map