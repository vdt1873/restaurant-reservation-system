import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🍽️ TableTime</Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-role-badge">{user.role === 'admin' ? 'Admin' : 'Customer'}</span>
            <span className="nav-user">Hi, {user.name}</span>
            {user.role === 'admin' ? (
              <Link to="/admin">Admin Dashboard</Link>
            ) : (
              <Link to="/dashboard">My Reservations</Link>
            )}
            <button onClick={handleLogout} className="btn-link">Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="btn-primary-sm">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
