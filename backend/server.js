// 1. ALWAYS initialize environment variables first
require('dotenv').config();

// 2. Core Node utilities
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

// 3. Third-party packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// 4. Local application files
const Table = require('./models/Table');
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const reservationRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized error handler - must be registered last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const dbURI = process.env.MONGO_URI; // Make sure this matches your .env file key exactly!

if (!dbURI) {
  console.error('CRITICAL ERROR: MONGO_URI is missing from your .env configuration.');
  process.exit(1);
}

// Database Connection & Server Boot
mongoose
  .connect(dbURI)
  .then(() => {
    console.log('Connected successfully to MongoDB Atlas!');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
