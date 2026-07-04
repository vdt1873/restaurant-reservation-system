// Run with: npm run seed
// Populates a fixed set of tables so there's data to book against immediately.

require('dotenv').config();

// console.log("MONGO_URI:");
// console.log(process.env.MONGO_URI);

const mongoose = require('mongoose');
const Table = require('../models/Table');

const tables = [
  { tableNumber: 1, capacity: 2 },
  { tableNumber: 2, capacity: 2 },
  { tableNumber: 3, capacity: 4 },
  { tableNumber: 4, capacity: 4 },
  { tableNumber: 5, capacity: 6 },
  { tableNumber: 6, capacity: 8 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  await Table.deleteMany({});
  await Table.insertMany(tables);

  console.log(`Seeded ${tables.length} tables.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
