require('dotenv').config();
const mongoose = require('mongoose');

/**
     * Default mongoose connection -> joviDB (website/public)
     * Secondary connection (staffConn) -> jovi_staff (dashboard/auth)
     * We create staffConn immediately so models can attach to it at require-time.
 */
const mainUri  = process.env.MONGO_URI;
const staffUri = process.env.MONGO_URI_STAFF;

if (!mainUri) {
  throw new Error('MONGO_URI is not set. Add it to .env');
}

const opts = {};

// export separate connections if you need two DBs
let staffConn;

const connectDB = async () => {
  try {
    await mongoose.connect(mainUri, opts);
    console.log(`[Mongo] Connected to (${mongoose.connection.name})`);
  } catch (err) {
    console.error('[Mongo] main error:', err.message);
    process.exit(1);
  }

  if (staffUri) {
    try {
      staffConn = await mongoose.createConnection(staffUri, opts).asPromise();
      console.log('[Mongo] Connected staff (%s)', staffConn.name);
    } catch (err) {
      console.error('[Mongo] jovi_staff error:', err.message);
    }
  } else {
    console.warn('[Mongo] MONGO_URI_STAFF not set; staff features disabled');
  }
}

const getStaffConn = () => staffConn;
const getMainConn = () => mongoose.connection;

module.exports = { connectDB, getStaffConn, getMainConn };