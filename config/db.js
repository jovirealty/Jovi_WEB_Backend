require('dotenv').config();
const mongoose = require('mongoose');

/**
     * Default mongoose connection -> joviDB (website/public)
     * Secondary connection (staffConn) -> jovi_staff (dashboard/auth)
     * We create staffConn immediately so models can attach to it at require-time.
 */

let staffConn = null;

const connectDB = async () => {
    try {
        // 1) Default connection for existing models (joviDB)
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`[mongo] Connected to: (${mongoose.connection.name})`);

        // 2) Secondary connection for staff/auth (jovi_staff)
        if(!staffConn) {
            staffConn = await mongoose.createConnection(process.env.MONGO_URI_STAFF, {});
            staffConn.on('connected', () => console.log(`[mongo] Connected to:  (${staffConn.name})`));
            staffConn.on('error', (err) => console.log('[mongo] jovi_staff error:', err.message));
        }
    } catch (err) {
        console.log(`[mongo] connection error: ${err.message}`);
        process.exit(1);
    }
};

const getStaffConn = () => staffConn;

module.exports = { connectDB, getStaffConn };