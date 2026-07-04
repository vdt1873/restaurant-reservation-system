const express = require('express');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tables - anyone authenticated can view tables (needed for booking form)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const tables = await Table.find({ isActive: true }).sort('tableNumber');
    res.json(tables);
  } catch (err) {
    next(err);
  }
});

// GET /api/tables/available?date=&timeSlot=&guests=
// Returns tables that fit the party size AND aren't already booked for that slot
router.get('/available', verifyToken, async (req, res, next) => {
  try {
    const { date, timeSlot, guests } = req.query;
    if (!date || !timeSlot || !guests) {
      return res.status(400).json({ message: 'date, timeSlot and guests are required' });
    }

    const bookedTableIds = await Reservation.find({ date, timeSlot, status: 'booked' }).distinct(
      'table'
    );

    const availableTables = await Table.find({
      isActive: true,
      capacity: { $gte: Number(guests) },
      _id: { $nin: bookedTableIds },
    }).sort('capacity');

    res.json(availableTables);
  } catch (err) {
    next(err);
  }
});

// POST /api/tables - admin only, add a new table
router.post('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { tableNumber, capacity } = req.body;
    if (!tableNumber || !capacity) {
      return res.status(400).json({ message: 'tableNumber and capacity are required' });
    }
    const table = await Table.create({ tableNumber, capacity });
    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tables/:id - admin only, update capacity or active status
router.put('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
