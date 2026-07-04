const express = require('express');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/reservations/time-slots - fixed list the frontend renders as a dropdown
router.get('/time-slots', verifyToken, (req, res) => {
  res.json(Reservation.TIME_SLOTS);
});

// POST /api/reservations - customer creates a reservation
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { tableId, date, timeSlot, numberOfGuests } = req.body;

    if (!tableId || !date || !timeSlot || !numberOfGuests) {
      return res.status(400).json({
        message: 'tableId, date, timeSlot and numberOfGuests are all required',
      });
    }

    // Basic date sanity check: no bookings in the past
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ message: 'Cannot book a reservation in the past' });
    }

    const table = await Table.findById(tableId);
    if (!table || !table.isActive) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Capacity validation
    if (numberOfGuests > table.capacity) {
      return res.status(400).json({
        message: `Table ${table.tableNumber} only seats ${table.capacity} guests`,
      });
    }

    // Overlap check — done here for a clear error message. The unique partial
    // index on (table, date, timeSlot, status: 'booked') is the hard guarantee
    // against race conditions (two people booking the same slot simultaneously).
    const conflict = await Reservation.findOne({
      table: tableId,
      date,
      timeSlot,
      status: 'booked',
    });
    if (conflict) {
      return res.status(409).json({
        message: 'This table is already booked for the selected date and time slot',
      });
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      table: tableId,
      date,
      timeSlot,
      numberOfGuests,
    });

    const populated = await reservation.populate('table');
    res.status(201).json(populated);
  } catch (err) {
    next(err); // duplicate key race condition falls through to errorHandler as a 409
  }
});

// GET /api/reservations/me - customer's own reservations
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('table')
      .sort('-date');
    res.json(reservations);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reservations/:id - customer cancels their OWN reservation
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Customers may only cancel their own bookings; admins use the /api/admin route instead
    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own reservations' });
    }

    reservation.status = 'cancelled';
    await reservation.save();
    res.json({ message: 'Reservation cancelled', reservation });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
