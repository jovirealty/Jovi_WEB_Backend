const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const cfg = require('../../config/doconfig/doconfig.js');
const { s3 } = require('./SpacesClient.js');
const { customAlphabet } = require('nanoid');

const nano = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

/**
 * Uploads a single file buffer to DigitalOcean Spaces.
 * @param {string} folder e.g. "OffMarketPropertyListings/SALE-abc123/Images"
 * @param {Express.Multer.File} file { buffer, mimetype, originalname, size }
 */
async function uploadBufferToSpaces(folder, file) {
  if (!file?.buffer) throw new Error('uploadBufferToSpaces: file.buffer missing');

  const trimmed = String(folder || '').replace(/^\/+|\/+$/g, '');
  const safeName = String(file.originalname || `${nano()}`).replace(/\s+/g, '_');
  const key = `${trimmed}/${Date.now()}_${safeName}`;          // ← always non-empty

  const cmd = new PutObjectCommand({
    Bucket: cfg.spaces.bucket,
    Key: key,                                                  // ← **MUST** be defined
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype || 'application/octet-stream',
  });

  await s3.send(cmd);

  const origin = cfg.spaces.cdnBase || `https://${cfg.spaces.bucket}.${cfg.spaces.endpoint}`;
  return {
    key,
    url: `${origin}/${key}`,
    name: path.basename(key),
    mime: file.mimetype,
    size: file.size ?? file.buffer.length,
  };
}

module.exports = { uploadBufferToSpaces };
