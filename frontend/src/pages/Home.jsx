import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page home-hero">
      <h1>Reserve your table, without the back-and-forth.</h1>
      <p>Book a table in a few clicks. No double bookings, no confusion.</p>
      {!user && (
        <div className="hero-actions">
          <Link to="/signup" className="btn-primary">Get started</Link>
          <Link to="/login" className="btn-secondary">Log in</Link>
        </div>
      )}
      {user && (
        <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary">
          Go to your dashboard
        </Link>
      )}
    </div>
  );
}
