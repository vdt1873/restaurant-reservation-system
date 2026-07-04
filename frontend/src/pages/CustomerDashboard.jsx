import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function CustomerDashboard() {
  const [reservations, setReservations] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [form, setForm] = useState({ date: '', timeSlot: '', numberOfGuests: 2, tableId: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const loadReservations = async () => {
    const { data } = await api.get('/reservations/me');
    setReservations(data);
  };

  useEffect(() => {
    loadReservations();
    api.get('/reservations/time-slots').then(({ data }) => setTimeSlots(data));
  }, []);

  // Whenever date/timeSlot/guests are all filled, fetch which tables are actually available
  useEffect(() => {
    const { date, timeSlot, numberOfGuests } = form;
    if (date && timeSlot && numberOfGuests) {
      api
        .get('/tables/available', { params: { date, timeSlot, guests: numberOfGuests } })
        .then(({ data }) => {
          setAvailableTables(data);
          setForm((f) => ({ ...f, tableId: '' }));
        })
        .catch(() => setAvailableTables([]));
    } else {
      setAvailableTables([]);
    }
  }, [form.date, form.timeSlot, form.numberOfGuests]);

  const handleBook = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!form.tableId) {
      setMessage({ type: 'error', text: 'Please select an available table' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/reservations', form);
      setMessage({ type: 'success', text: 'Reservation confirmed!' });
      setForm({ date: '', timeSlot: '', numberOfGuests: 2, tableId: '' });
      setAvailableTables([]);
      loadReservations();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Booking failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      loadReservations();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Cancel failed' });
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page">
      <h1>Book a table</h1>
      {message.text && (
        <div className={message.type === 'error' ? 'error-banner' : 'success-banner'}>
          {message.text}
        </div>
      )}

      <form className="card booking-form" onSubmit={handleBook}>
        <div className="form-row">
          <label>
            Date
            <input
              type="date"
              min={today}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </label>
          <label>
            Time slot
            <select
              value={form.timeSlot}
              onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
              required
            >
              <option value="">Select a time</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </label>
          <label>
            Guests
            <input
              type="number"
              min={1}
              max={20}
              value={form.numberOfGuests}
              onChange={(e) => setForm({ ...form, numberOfGuests: Number(e.target.value) })}
              required
            />
          </label>
        </div>

        {form.date && form.timeSlot && (
          <label>
            Available tables
            <select
              value={form.tableId}
              onChange={(e) => setForm({ ...form, tableId: e.target.value })}
              required
            >
              <option value="">
                {availableTables.length ? 'Select a table' : 'No tables available for this slot'}
              </option>
              {availableTables.map((t) => (
                <option key={t._id} value={t._id}>
                  Table {t.tableNumber} (seats {t.capacity})
                </option>
              ))}
            </select>
          </label>
        )}

        <button type="submit" className="btn-primary" disabled={loading || !form.tableId}>
          {loading ? 'Booking...' : 'Confirm reservation'}
        </button>
      </form>

      <h2>My reservations</h2>
      {reservations.length === 0 ? (
        <p className="empty-state">You have no reservations yet.</p>
      ) : (
        <div className="reservation-list">
          {reservations.map((r) => (
            <div key={r._id} className={`reservation-card status-${r.status}`}>
              <div>
                <strong>{r.date}</strong> at {r.timeSlot} — Table {r.table?.tableNumber}
                <div className="muted">{r.numberOfGuests} guest(s)</div>
              </div>
              <div className="reservation-actions">
                <span className={`badge badge-${r.status}`}>{r.status}</span>
                {r.status === 'booked' && (
                  <button className="btn-danger-sm" onClick={() => handleCancel(r._id)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
