import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

interface AdminAttendanceItem {
  id: number;
  type: string;
  notes: string;
  clockIn: string;
  clockInLocation: { latitude: number; longitude: number };
  clockOut: string | null;
  clockOutLocation: { latitude: number; longitude: number } | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

const API_BASE = 'http://localhost:3000';

export const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<AdminAttendanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal photo preview
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Role protection: Only admins may access this page
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else {
        const role = (user.role || '').toUpperCase();
        if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
          navigate('/attendance', { replace: true });
        }
      }
    }
  }, [user, authLoading, navigate]);

  const fetchLogs = async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE}/attendance/all?page=${targetPage}&pageSize=${pageSize}`,
        { credentials: 'include' },
      );

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. Administrator privileges required.');
        }
        throw new Error('Failed to load attendance logs.');
      }

      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (err: any) {
      setError(err?.message || 'Error loading attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const role = (user.role || '').toUpperCase();
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        fetchLogs(page);
      }
    }
  }, [user, page]);

  if (authLoading) {
    return <div className="page-loading">Checking authorization...</div>;
  }

  return (
    <div className="admin-container">
      <div className="page-header">
        <div>
          <h2>Employee Attendance Logs</h2>
          <p className="subtitle">
            Admin oversight: View all employee WFH attendance, GPS locations, and photo records.
          </p>
        </div>
        <div className="header-meta">
          <span className="badge badge-admin">Administrator View</span>
          <span className="badge badge-readonly">🔒 Read-Only (Immutable Audit Log)</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-card">
        <div className="table-header-row">
          <h3>
            All Recorded Logs <span className="text-muted">({total} total)</span>
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchLogs(page)}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '↻ Refresh Logs'}
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading attendance records...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>No attendance records found yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>WFH Note</th>
                  <th>Photos</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="user-info">
                        <strong>{item.user?.name || 'Unknown'}</strong>
                        <span className="user-email">{item.user?.email || '-'}</span>
                      </div>
                    </td>
                    <td>{new Date(item.clockIn).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-wfh">{item.type || 'WFH'}</span>
                    </td>
                    <td>
                      <div className="time-geo">
                        <strong>
                          {new Date(item.clockIn).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                        <span className="geo-tag">
                          📍 {item.clockInLocation?.latitude?.toFixed(4)},{' '}
                          {item.clockInLocation?.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.clockOut ? (
                        <div className="time-geo">
                          <strong>
                            {new Date(item.clockOut).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </strong>
                          <span className="geo-tag">
                            📍 {item.clockOutLocation?.latitude?.toFixed(4)},{' '}
                            {item.clockOutLocation?.longitude?.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-active">In Progress</span>
                      )}
                    </td>
                    <td className="note-cell">{item.notes}</td>
                    <td>
                      <div className="photo-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => setActivePhotoUrl(`${API_BASE}/attendance/${item.id}/photo/in`)}
                        >
                          Clock-In
                        </button>
                        {item.clockOut && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setActivePhotoUrl(`${API_BASE}/attendance/${item.id}/photo/out`)}
                          >
                            Clock-Out
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="pagination">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= Math.ceil(total / pageSize) || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {activePhotoUrl && (
        <div className="modal-backdrop" onClick={() => setActivePhotoUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Employee Attendance Photo Proof</h4>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActivePhotoUrl(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <img src={activePhotoUrl} alt="Employee verification proof" className="modal-image" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};