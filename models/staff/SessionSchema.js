const { Schema } = require('mongoose');
const { getStaffConn } = require('../../config/db');

const SessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    userAgent: { type: String },
    expiresAt: { type: Date, index: { expires: 0 } },
    revokedAt: { type: Date },
}, { timestamps: true });

const conn = getStaffConn() || require('mongoose').connection;
module.exports = conn.model('Session', SessionSchema);