import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from './hooks/useAuth';
import './App.css';

export function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isAdmin = user && (user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPERADMIN');

  return (
    <div className="app-layout">
      <header className="app-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-logo">⚡</span>
            <span className="brand-name">HRIS One</span>
          </div>

          {user ? (
            <div className="navbar-controls">
              <nav className="navbar-links">
                {isAdmin ? (
                  <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    Attendance Logs (Admin)
                  </NavLink>
                ) : (
                  <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    My Attendance
                  </NavLink>
                )}
              </nav>

              <div className="user-profile">
                <span className="user-name">{user.name}</span>
                <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
                  {user.role}
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="navbar-controls">
              <span className="navbar-tag">Employee & Admin Portal</span>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
