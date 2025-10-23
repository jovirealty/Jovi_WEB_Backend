const { S3Client } = require("@aws-sdk/client-s3");
const cfg = require("../../config/doconfig/doconfig.js");

const s3 = new S3Client({
    region: cfg.spaces.region,
    endpoint: `https://${cfg.spaces.endpoint}`,
    credentials: {
        accessKeyId: cfg.spaces.key,
        secretAccessKey: cfg.spaces.secret,
    },
});

module.exports = { s3 };