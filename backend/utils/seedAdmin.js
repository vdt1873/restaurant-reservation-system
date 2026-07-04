require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_NAME = 'Restaurant Admin';
const ADMIN_EMAIL = 'admin@restaurant.com';
const ADMIN_PASSWORD = 'admin123';

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for admin seeding...');

  let admin = await User.findOne({ email: ADMIN_EMAIL });

  if (admin) {
    admin.role = 'admin';
    await admin.save();
    console.log(`Existing user promoted to admin: ${ADMIN_EMAIL}`);
  } else {
    admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Admin account created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Admin seeding failed:', err);
  process.exit(1);
});