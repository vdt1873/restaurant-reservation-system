import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [message, setMessage] = useState('');
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '' });

  const loadReservations = async (date) => {
    const { data } = await api.get('/admin/reservations', { params: date ? { date } : {} });
    setReservations(data);
  };

  const loadTables = async () => {
    const { data } = await api.get('/tables');
    setTables(data);
  };

  useEffect(() => {
    loadReservations();
    loadTables();
  }, []);

  const handleFilter = (e) => {
    const date = e.target.value;
    setDateFilter(date);
    loadReservations(date);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this reservation?')) return;
    await api.delete(`/admin/reservations/${id}`);
    loadReservations(dateFilter);
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/tables', {
        tableNumber: Number(newTable.tableNumber),
        capacity: Number(newTable.capacity),
      });
      setNewTable({ tableNumber: '', capacity: '' });
      loadTables();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not add table');
    }
  };

  return (
    <div className="page">
      <h1>Admin dashboard</h1>

      <section className="card">
        <h2>All reservations</h2>
        <label className="filter-label">
          Filter by date
          <input type="date" value={dateFilter} onChange={handleFilter} />
          {dateFilter && (
            <button className="btn-link" onClick={() => { setDateFilter(''); loadReservations(); }}>
              Clear filter
            </button>
          )}
        </label>

        {reservations.length === 0 ? (
          <p className="empty-state">No reservations found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Table</th>
                <th>Guests</th>
                <th>Customer</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>{r.timeSlot}</td>
                  <td>{r.table?.tableNumber ?? '—'}</td>
                  <td>{r.numberOfGuests}</td>
                  <td>{r.user?.name} <span className="muted">({r.user?.email})</span></td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td>
                    {r.status === 'booked' && (
                      <button className="btn-danger-sm" onClick={() => handleCancel(r._id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Manage tables</h2>
        {message && <div className="error-banner">{message}</div>}
        <ul className="table-list">
          {tables.map((t) => (
            <li key={t._id}>Table {t.tableNumber} — seats {t.capacity}</li>
          ))}
        </ul>
        <form className="form-row" onSubmit={handleAddTable}>
          <label>
            Table number
            <input
              type="number"
              value={newTable.tableNumber}
              onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
              required
            />
          </label>
          <label>
            Capacity
            <input
              type="number"
              value={newTable.capacity}
              onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="btn-primary">Add table</button>
        </form>
      </section>
    </div>
  );
}
