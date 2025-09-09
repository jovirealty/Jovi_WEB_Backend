// scripts/seedSuperAdmin.js
require('dotenv').config();
const argon2 = require('argon2');
const { connectDB } = require('../config/db');

(async () => {
  try {
    // 1) Ensure BOTH connections are created (joviDB + jovi_staff)
    await connectDB();

    // 2) IMPORTANT: Require the model AFTER connectDB()
    //    so StaffAccountSchema binds to the staff connection.
    const StaffAccount = require('../models/staff/StaffAccountSchema');

    const email = (process.argv[2] || '').toLowerCase();
    const plain = process.argv[3];

    if (!email || !plain) {
      console.error('Usage: node scripts/seedSuperAdmin.js <email> <password>');
      process.exit(1);
    }

    // 3) Normal upsert logic
    const exists = await StaffAccount.findOne({ email }).lean();
    if (exists) {
      console.error('Superadmin already exists:', email);
      process.exit(1);
    }

    const passwordHash = await argon2.hash(plain);
    await StaffAccount.create({
      email,
      roles: ['superadmin'],
      passwordHash,
      passwordSetAt: new Date(),
      isActive: true
    });

    console.log('Superadmin created:', email);
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
})();
