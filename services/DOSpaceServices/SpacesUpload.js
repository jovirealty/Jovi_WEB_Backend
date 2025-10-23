const { PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const cfg = require("../../config/doconfig/doconfig.js");
const { s3 } = require("./SpacesClient.js");

async function uploadBufferToSpaces (folder, file) {
    const safe = file.originalname.replace(/\s+/g, "_");
    const key = `${folder}/${Date.now()}_${safe}`;

    const cmd = new PutObjectCommand({
        Bucket: cfg.spaces.bucket,
        key: key,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype
    });

    await s3.send(cmd);

    const base = cfg.spaces.cdnBase || `https://${cfg.spaces.bucket}.${cfg.spaces.endpoint}`;

    return {
        key,
        url: `${base}/${key}`,
        size: file.size,
        mime: file.mimetype,
        name: path.basename(key),
    };
}

module.exports = { uploadBufferToSpaces };