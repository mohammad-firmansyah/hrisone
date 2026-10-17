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
            <span className="brand-icon">H</span>
            <span>HRIS One</span>
          </div>

          {user ? (
            <div className="navbar-controls">
              <nav className="navbar-links">
                {isAdmin ? (
                  <>
                    <NavLink
                      to="/admin/employees"
                      className={({ isActive }) =>
                        `nav-item ${isActive || window.location.pathname === '/admin' ? 'active' : ''}`
                      }
                    >
                      Master Karyawan
                    </NavLink>
                    <NavLink
                      to="/admin/attendance"
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                      Kontrol Absensi
                    </NavLink>
                  </>
                ) : (
                  <NavLink
                    to="/attendance"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    Presensi WFH
                  </NavLink>
                )}
              </nav>

              <div className="user-profile">
                <span className="user-name">{user.name}</span>
                <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
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
