const { Schema } = require('mongoose');
const { getStaffConn } = require('../../config/db');

const StaffAccountSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        roles: {type: [String], default: ['agent']},
        passwordHash: {type: String, required: true},
        mustChangePassword: {type: Boolean, default: false},
        passwordSetAt: { type: Date },
        isActive: { type: Boolean, default: true },
        isSuspended: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "StaffAccount" },
        lastLoginAt: { type: Date },
        fullName: { type: String, trim: true },
        agentListId: { type: Schema.Types.ObjectId, index: true, sparse: true },
        isSuperAdmin: { type: Boolean, default: false },
    },
    {timestamps: true},
);


// Bind model to the staff connection
const conn = getStaffConn();
if (!conn) {
  throw new Error('[StaffAccount] staff connection not initialized. Call connectDB() before requiring models.');
}


module.exports = conn.models.StaffAccount || conn.model('StaffAccount', StaffAccountSchema);