# Restaurant Reservation Management System

A full-stack MERN app for booking and managing restaurant table reservations, with separate
customer and admin roles.

## Tech stack

- **Frontend:** React (Vite), React Router, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (JSON Web Tokens), bcrypt for password hashing

## Project structure

```
restaurant-reservation-system/
  backend/
    models/         User, Table, Reservation schemas
    routes/         auth, tables, reservations, admin
    middleware/      JWT auth, role checks, central error handler
    utils/seedTables.js
    server.js
  frontend/
    src/
      pages/         Home, Login, Signup, CustomerDashboard, AdminDashboard
      components/     Navbar, ProtectedRoute
      context/        AuthContext (global auth state)
      api/axios.js    Axios instance that auto-attaches the JWT
```

## Setup instructions

### 1. Database
Create a free MongoDB Atlas cluster (or run MongoDB locally). Get the connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN
npm install
npm run seed     # populates 6 sample tables
npm run dev       # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# edit .env: set VITE_API_URL (e.g. http://localhost:5000/api)
npm install
npm run dev       # starts on http://localhost:5173
```

### 4. Create the admin account
Public signup only ever creates customer accounts (see "Role-based access control" below for
why). To get an admin account:
```bash
cd backend
npm run seed:admin
```
This creates `admin@restaurant.com` / `admin123` (edit `utils/seedAdmin.js` to change these).
Log in with those credentials to reach the admin dashboard.

### 5. Try it out
- Sign up as a **Customer** to book tables.
- Log in with the seeded admin account to view/manage all reservations and add tables.

## Assumptions made

- Single restaurant, fixed set of tables (seeded via `npm run seed`), each with a defined
  seating capacity.
- Reservations use a **fixed list of time slots** (e.g. 18:00, 18:30, 19:00...) rather than
  arbitrary free-form times. This was a deliberate simplification: with discrete slots, "is
  this table free?" becomes a simple lookup instead of a time-range overlap calculation. It
  keeps the conflict logic unambiguous and easy to verify, at the cost of flexibility (see
  Limitations).
- Admin accounts are never created through public signup — only via `npm run seed:admin`
  (backend/utils/seedAdmin.js). This is deliberate: if admin were selectable at signup, anyone
  could grant themselves visibility into every customer's name and email, which defeats the
  purpose of having a separate role at all.
- Cancelled reservations are soft-deleted (`status: 'cancelled'`) rather than removed, so
  history is preserved and the same table/slot becomes available again for new bookings.

## Reservation & availability logic

This was the core focus of the assignment, so here's exactly how it works:

1. **Capacity check:** when booking, the selected table's `capacity` must be `>=`
   `numberOfGuests`. The "available tables" endpoint (`GET /api/tables/available`) only
   returns tables that already satisfy this, so the customer never even sees a table too
   small for their party.
2. **Overlap prevention — two layers:**
   - **Application-level check:** before creating a reservation, the backend queries for an
     existing `booked` reservation on the same `table + date + timeSlot`. If found, it
     returns a `409 Conflict` with a clear message.
   - **Database-level guarantee:** a MongoDB **partial unique index** on
     `{ table, date, timeSlot }` (only enforced where `status: 'booked'`) makes it physically
     impossible for two active reservations to exist for the same table/date/slot — even if
     two requests race each other at the exact same moment. The app-level check gives a nice
     error message; the index is the actual correctness guarantee.
   - Cancelled reservations are excluded from the index (`partialFilterExpression`), so
     cancelling a booking immediately frees up that slot for someone else.
3. **Past-date guard:** the backend rejects reservations for dates before today.
4. **Invalid input handling:** missing fields, invalid table IDs, and validation errors are
   caught and returned as `400`s with descriptive messages via a centralized error handler
   (`middleware/errorHandler.js`), instead of leaking stack traces or crashing the process.

## Role-based access control

- Every protected route requires a valid JWT (`middleware/auth.js` → `verifyToken`), which is
  issued at login/signup and stored in `localStorage` on the frontend, then attached to every
  request via an Axios interceptor.
- `requireAdmin` middleware gates all `/api/admin/*` routes and table-creation — customers get
  a `403` if they try to hit them directly.
- On the frontend, `ProtectedRoute` reads the logged-in user's role from context and redirects
  away from `/dashboard` or `/admin` if the role doesn't match, so customers can't navigate
  into the admin UI even if they know the URL.
- Customers can only cancel **their own** reservations — enforced server-side by comparing
  `reservation.user` to the requester's ID, not just hidden in the UI.
- The `/api/auth/signup` route hard-codes `role: 'customer'` server-side and ignores any
  `role` field a client might send — so even a modified request from Postman/curl can't
  self-grant admin access. Admin accounts only exist via `npm run seed:admin`.

## Known limitations

- Fixed time slots rather than arbitrary time ranges (see Assumptions above) — a real
  restaurant might want variable reservation durations.
- No email/SMS confirmation or reminders (explicitly out of scope per the assignment).
- Only one admin account is seeded; there's no UI for promoting other users to admin
  (would be done directly in the database or via a future admin-invite flow).
- No pagination on the admin reservation list — fine at demo scale, would need it for a busy
  restaurant with a long history.
- No automated test suite (unit/integration tests) due to the 48-hour scope.

## Areas for improvement with more time

- Add pagination and search/sort on the admin reservations table.
- Support variable-duration reservations with true time-range overlap checking instead of
  fixed slots.
- Add automated tests (Jest/Supertest for the API, React Testing Library for the frontend).
- Waitlist feature for fully booked slots.
- Rate limiting and stronger input sanitization on public endpoints.
- Email confirmations on booking/cancellation.