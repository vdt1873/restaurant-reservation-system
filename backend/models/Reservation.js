const mongoose = require('mongoose');

// Fixed slots keep the overlap check simple and unambiguous (see README for reasoning)
const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    date: { type: String, required: true }, // stored as 'YYYY-MM-DD' to avoid timezone drift
    timeSlot: { type: String, required: true, enum: TIME_SLOTS },
    numberOfGuests: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
  },
  { timestamps: true }
);

// A table can only hold one ACTIVE reservation per date+slot.
// Partial index (status: 'booked') so cancelled reservations don't block the slot.
reservationSchema.index(
  { table: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } }
);

reservationSchema.statics.TIME_SLOTS = TIME_SLOTS;

module.exports = mongoose.model('Reservation', reservationSchema);
