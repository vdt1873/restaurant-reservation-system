const express = require('express');
const Reservation = require('../models/Reservation');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes below require a logged-in admin
router.use(verifyToken, requireAdmin);

// GET /api/admin/reservations?date=YYYY-MM-DD - view all, optionally filtered by date
router.get('/reservations', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;

    const reservations = await Reservation.find(filter)
      .populate('user', 'name email')
      .populate('table')
      .sort('date timeSlot');

    res.json(reservations);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/reservations/:id - admin updates any reservation (e.g. change table/slot/guests)
router.put('/reservations/:id', async (req, res, next) => {
  try {
    const { table, date, timeSlot, numberOfGuests, status } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // If changing table/date/slot, re-check for conflicts against OTHER bookings
    const newTable = table || reservation.table;
    const newDate = date || reservation.date;
    const newSlot = timeSlot || reservation.timeSlot;

    if (table || date || timeSlot) {
      const conflict = await Reservation.findOne({
        _id: { $ne: reservation._id },
        table: newTable,
        date: newDate,
        timeSlot: newSlot,
        status: 'booked',
      });
      if (conflict) {
        return res.status(409).json({ message: 'That table is already booked for that slot' });
      }
    }

    if (table) reservation.table = table;
    if (date) reservation.date = date;
    if (timeSlot) reservation.timeSlot = timeSlot;
    if (numberOfGuests) reservation.numberOfGuests = numberOfGuests;
    if (status) reservation.status = status;

    await reservation.save();
    const populated = await reservation.populate(['table', { path: 'user', select: 'name email' }]);
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/reservations/:id - admin cancels any reservation
router.delete('/reservations/:id', async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    reservation.status = 'cancelled';
    await reservation.save();
    res.json({ message: 'Reservation cancelled', reservation });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
