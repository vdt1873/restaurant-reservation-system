// Centralized error handler. Any `next(err)` call across the app lands here.
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key error (also used for our overlap-prevention index)
  if (err.code === 11000) {
    if (err.keyPattern && err.keyPattern.table) {
      return res.status(409).json({
        message: 'This table is already booked for the selected date and time slot.',
      });
    }
    return res.status(409).json({ message: 'Duplicate value entered.' });
  }

  // Invalid ObjectId format
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message || 'Server error' });
};

module.exports = errorHandler;
