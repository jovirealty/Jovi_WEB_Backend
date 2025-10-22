// util/doconfig.js
require('dotenv').config();

const cfg = {
  // SPACES / S3 compatible settings
  spaces: {
    endpoint: process.env.SPACES_ENDPOINT, // e.g. "sfo3.digitaloceanspaces.com"
    bucket: process.env.SPACES_BUCKET,     // e.g. "media-jovirealty"
    key: process.env.SPACES_KEY,
    secret: process.env.SPACES_SECRET,
    cdnBase: process.env.SPACES_CDN || null, // e.g. "https://cdn.media-jovirealty.com"
    region: process.env.SPACES_REGION || "sfo3",
  },
};

module.exports = cfg;
